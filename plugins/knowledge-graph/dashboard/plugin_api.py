"""Knowledge Graph dashboard plugin — backend API routes.

Mounted at ``/api/plugins/knowledge-graph/`` by the dashboard plugin
system (see :func:`hermes_cli.web_server._mount_plugin_api_routes`).

This module exposes a small FastAPI ``router`` that:

* Persists the graph in a SQLite database at ``~/.hermes/knowledge-graph.db``
* Indexes an Obsidian vault (default ``~/proyectos/codigosinsiesta``,
  override via ``KG_OBSIDIAN_VAULT`` or the ``vault_path`` row in the DB
  ``sources`` table) by walking every ``.md`` file and extracting:
  - YAML frontmatter
  - Wikilinks ``[[Page]]`` / ``[[Page#Heading]]`` / ``[[Page|Alias]]``
  - Inline ``#tag`` (ignoring everything inside fenced code blocks)
* Runs an asynchronous reindex job with progress tracking
* Returns nodes / edges / search / job status as JSON

Auth note
---------
Plugin HTTP routes go through the dashboard's session-token auth
middleware (``web_server.auth_middleware``), so every
``/api/plugins/knowledge-graph/`` request must carry the session bearer
(or the cookie set when the dashboard HTML was loaded). The CSRF token
is the random ``_SESSION_TOKEN`` printed at server startup, injected
into pages as ``window.__HERMES_SESSION_TOKEN__``. The plugin calls
``SDK.fetchJSON`` from the frontend, which adds that header
automatically.

Supported source kinds (phase 1 only ``obsidian`` is wired in;
``gbrain`` and ``hermes`` stay listed so the UI shows them as
"coming soon" without crashing):

* ``obsidian`` — vault path configurable per source row
* ``gbrain``   — disabled, returns empty graph (TODO)
* ``hermes``   — disabled, returns empty graph (TODO)
"""

from __future__ import annotations

import asyncio
import logging
import os
import re
import sqlite3
import time
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

_log = logging.getLogger("kg-plugin")

# -----------------------------------------------------------------------------
# Constants
# -----------------------------------------------------------------------------

PLUGIN_VERSION = "0.1.0"
DB_PATH_DEFAULT = Path.home() / ".hermes" / "knowledge-graph.db"

# Source kinds we know about — keys must match ``KgSource.id`` and the
# ``source`` column on ``kg_nodes``. Obsidian is the only one wired up
# in phase 1 but the others are listed so the frontend can show
# "coming soon" affordances without 404s.
SOURCE_IDS = ("obsidian", "gbrain", "hermes")

# Robust wikilink regex (per the spec):
#   [[Page]]
#   [[Page#Heading]]
#   [[Page|Alias]]
#   [[Page#Heading|Alias]]
# The first capture is the *target* page name (no alias / no heading).
# Heading and alias are optional and captured separately if we ever
# want to render them in tooltips.
#
# Important detail: the target must NOT contain ``#`` or ``|`` because
# those open the heading and alias clauses. The earlier draft used
# ``[^\]|]+`` which swallowed the ``#Heading`` into the target. The
# fixed pattern lets only non-``#``/``|`` chars accumulate in the
# target, then optionally consumes ``#Heading`` and/or ``|Alias``.
WIKILINK_RE = re.compile(
    r"\[\[([^\]|#]+?)(?:#([^\]|]+))?(?:\|([^\]]+))?\]\]"
)

# Inline tags: "#word" at the start of a word boundary. We filter out
# anything inside fenced code blocks before applying this regex (see
# ``_strip_code_blocks`` below).
INLINE_TAG_RE = re.compile(r"(?:^|\s)#([A-Za-z0-9_/\-]+)")

# Frontmatter is a leading YAML block between two "---" lines.
FRONTMATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)


# -----------------------------------------------------------------------------
# Pydantic models
# -----------------------------------------------------------------------------


class KgNode(BaseModel):
    id: str
    source: str  # one of SOURCE_IDS
    kind: str    # note | tag | page | skill | company | person
    title: str
    preview: str = ""
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: Optional[str] = None  # ISO 8601
    updated_at: Optional[str] = None  # ISO 8601


class KgEdge(BaseModel):
    source: str  # node id
    target: str  # node id
    kind: str    # wikilink | tag | mentions | related
    weight: float = 1.0
    context: Optional[str] = None


class KgSource(BaseModel):
    id: str
    enabled: bool
    node_count: int = 0
    last_sync: Optional[str] = None  # ISO 8601


class KgHealth(BaseModel):
    status: str = "ok"
    version: str = PLUGIN_VERSION
    sources: Dict[str, bool] = Field(default_factory=dict)


# -----------------------------------------------------------------------------
# Database layer
# -----------------------------------------------------------------------------


def _now_iso() -> str:
    """Return ``now`` in UTC as an ISO 8601 string with a Z suffix."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _vault_name(path: Path) -> str:
    return path.name or "vault"


def _resolve_vault_path(stored: Optional[str]) -> Path:
    """Resolve the configured Obsidian vault, honouring env overrides."""

    env_override = os.environ.get("KG_OBSIDIAN_VAULT", "").strip()
    candidate = env_override or stored or os.environ.get(
        "HERMES_DEFAULT_OBSIDIAN_VAULT", ""
    ).strip() or str(Path.home() / "proyectos" / "codigosinsiesta")
    return Path(candidate).expanduser().resolve()


def _connect(db_path: Path) -> sqlite3.Connection:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(db_path), timeout=30, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    _ensure_schema(conn)
    return conn


@contextmanager
def _get_conn(db_path: Path = DB_PATH_DEFAULT):
    conn = _connect(db_path)
    try:
        yield conn
    finally:
        conn.close()


def _ensure_schema(conn: sqlite3.Connection) -> None:
    """Create tables if missing. Idempotent — safe to call repeatedly."""

    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS sources (
            id           TEXT PRIMARY KEY,
            enabled      INTEGER NOT NULL DEFAULT 0,
            node_count   INTEGER NOT NULL DEFAULT 0,
            last_sync    TEXT,
            vault        TEXT
        );

        CREATE TABLE IF NOT EXISTS kg_nodes (
            id          TEXT PRIMARY KEY,
            source      TEXT NOT NULL,
            kind        TEXT NOT NULL,
            title       TEXT NOT NULL,
            preview     TEXT NOT NULL DEFAULT '',
            metadata    TEXT NOT NULL DEFAULT '{}',  -- JSON
            created_at  TEXT,
            updated_at  TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_kg_nodes_source ON kg_nodes(source);

        CREATE TABLE IF NOT EXISTS kg_edges (
            source      TEXT NOT NULL,
            target      TEXT NOT NULL,
            kind        TEXT NOT NULL,
            weight      REAL NOT NULL DEFAULT 1.0,
            context     TEXT,
            PRIMARY KEY (source, target, kind)
        );
        CREATE INDEX IF NOT EXISTS idx_kg_edges_source ON kg_edges(source);
        CREATE INDEX IF NOT EXISTS idx_kg_edges_target ON kg_edges(target);

        CREATE TABLE IF NOT EXISTS jobs (
            job_id      TEXT PRIMARY KEY,
            source      TEXT NOT NULL,
            status      TEXT NOT NULL,         -- running|done|error
            progress    REAL NOT NULL DEFAULT 0.0,
            message     TEXT,
            started_at  TEXT NOT NULL,
            ended_at    TEXT
        );
        """
    )
    # Seed the three sources if missing.
    for sid in SOURCE_IDS:
        conn.execute(
            "INSERT OR IGNORE INTO sources(id, enabled) VALUES (?, ?)",
            (sid, 1 if sid == "obsidian" else 0),
        )


def _row_to_node(row: sqlite3.Row) -> KgNode:
    import json as _json
    try:
        meta = _json.loads(row["metadata"]) if row["metadata"] else {}
    except Exception:
        meta = {}
    return KgNode(
        id=row["id"],
        source=row["source"],
        kind=row["kind"],
        title=row["title"],
        preview=row["preview"],
        metadata=meta,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _row_to_edge(row: sqlite3.Row) -> KgEdge:
    return KgEdge(
        source=row["source"],
        target=row["target"],
        kind=row["kind"],
        weight=row["weight"],
        context=row["context"],
    )


# -----------------------------------------------------------------------------
# Markdown parsing helpers
# -----------------------------------------------------------------------------


def _strip_code_blocks(text: str) -> str:
    """Remove fenced code blocks and inline code spans so we don't
    mistake ``#tag`` mentions inside code for real tags / wikilinks."""

    text = re.sub(r"```.*?```", " ", text, flags=re.DOTALL)
    text = re.sub(r"`[^`\n]+`", " ", text)
    return text


def _extract_frontmatter(text: str) -> Tuple[Dict[str, Any], str]:
    match = FRONTMATTER_RE.match(text)
    if not match:
        return {}, text
    raw = match.group(1)
    body = text[match.end():]
    try:
        import yaml
        data = yaml.safe_load(raw) or {}
        if not isinstance(data, dict):
            data = {}
    except Exception:
        data = {}
    return data, body


def parse_wikilinks(text: str) -> List[Dict[str, str]]:
    """Return a list of ``{target, heading, alias}`` records from wikilinks.

    Targets are normalized: leading/trailing whitespace stripped; alias
    never used as the target (per Obsidian behaviour, ``[[A|B]]`` resolves
    to page ``A`` with display text ``B``)."""

    cleaned = _strip_code_blocks(text)
    out: List[Dict[str, str]] = []
    for match in WIKILINK_RE.finditer(cleaned):
        target = match.group(1).strip()
        heading = (match.group(2) or "").strip()
        alias = (match.group(3) or "").strip()
        if not target:
            continue
        out.append({"target": target, "heading": heading, "alias": alias})
    return out


def parse_inline_tags(text: str) -> List[str]:
    """Return unique inline ``#tag`` mentions, ignoring code blocks and
    headings (``# heading`` does not count). We require the tag character
    to be preceded by whitespace or be at the start of the line — the
    heading rule.

    Note: we strip code blocks first to avoid false positives, then run
    a boundary-aware scan."""

    cleaned = _strip_code_blocks(text)
    found: List[str] = []
    seen: set = set()
    for line in cleaned.splitlines():
        stripped = line.lstrip()
        # ``# heading`` at the start of a line is NOT a tag
        if stripped.startswith("# "):
            line_body = stripped[2:]
        else:
            line_body = line
        for match in INLINE_TAG_RE.finditer(line_body):
            tag = match.group(1)
            # Tags must be at least 2 chars (skip lone "#a")
            if len(tag) < 2 or tag.lower() in seen:
                continue
            seen.add(tag.lower())
            found.append(tag)
    return found


# -----------------------------------------------------------------------------
# Indexer
# -----------------------------------------------------------------------------


def _iter_markdown_files(vault: Path) -> Iterable[Path]:
    """Yield every ``.md`` (case-insensitive) under ``vault``."""

    if not vault.is_dir():
        return
    for path in vault.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() in (".md", ".markdown"):
            yield path


def _obsidian_node_id(vault: Path, file_path: Path) -> str:
    rel = file_path.relative_to(vault).as_posix()
    return f"obsidian:{_vault_name(vault)}:{rel}"


def _obsidian_target_id(vault: Path, target: str) -> str:
    """Build a deterministic target id even when the target file does not
    exist yet — Obsidian happily creates dangling wikilinks and we want
    to surface them in the graph as well."""

    normalized = target.strip().strip("/")
    return f"obsidian:{_vault_name(vault)}:{normalized}.md"


def _tag_node_id(source: str, tag: str) -> str:
    return f"{source}:tag:{tag.lower()}"


def index_obsidian_vault(
    conn: sqlite3.Connection,
    vault_path: Optional[str] = None,
    progress_cb=None,
) -> Dict[str, int]:
    """Re-index the Obsidian vault, replacing all rows where
    ``source = 'obsidian'``.

    ``progress_cb(done, total)`` is invoked after each file with the
    running tally so an HTTP poller can expose it.
    """

    vault = _resolve_vault_path(vault_path)
    if not vault.is_dir():
        raise FileNotFoundError(f"Obsidian vault not found at {vault}")

    # Persist the chosen vault back to the DB so the next read picks it up.
    conn.execute(
        "UPDATE sources SET vault=? WHERE id='obsidian'", (str(vault),)
    )

    files = list(_iter_markdown_files(vault))
    total = len(files)
    done = 0
    node_count = 0
    tag_count = 0
    edge_count = 0
    seen_tags: set = set()

    # Snapshot every Obsidian node id so we know which edges to drop.
    # Edges that connect two non-obsidian nodes are kept; edges where
    # EITHER side is an obsidian node (or the dangling ``obsidian:...``
    # node id from an earlier run) are removed together with the nodes.
    old_node_ids = {
        r["id"]
        for r in conn.execute(
            "SELECT id FROM kg_nodes WHERE source='obsidian'"
        ).fetchall()
    }
    if old_node_ids:
        placeholders = ",".join("?" * len(old_node_ids))
        # Remove edges touching any pre-existing obsidian node first so
        # foreign-key cascade doesn't kick in (we don't have FK here, but
        # explicit is safer than relying on SELECT ordering).
        conn.execute(
            f"DELETE FROM kg_edges WHERE source IN ({placeholders}) "
            f"OR target IN ({placeholders})",
            (*old_node_ids, *old_node_ids),
        )
        conn.execute(
            f"DELETE FROM kg_nodes WHERE id IN ({placeholders})",
            tuple(old_node_ids),
        )
    # Also drop synthetic tag nodes that no longer have any inbound edge —
    # we'll recreate the ones we still need below.
    conn.execute(
        "DELETE FROM kg_nodes WHERE source='obsidian' AND kind='tag'"
    )

    for file_path in files:
        try:
            rel = file_path.relative_to(vault).as_posix()
            text = file_path.read_text(encoding="utf-8", errors="replace")
        except Exception as exc:
            _log.warning("Skip %s: %s", file_path, exc)
            continue

        frontmatter, body = _extract_frontmatter(text)
        stat = file_path.stat()
        node_id = _obsidian_node_id(vault, file_path)
        title = (
            frontmatter.get("title")
            if isinstance(frontmatter.get("title"), str)
            else file_path.stem
        )
        preview_src = body.strip().split("\n", 1)[0] if body.strip() else ""
        preview = preview_src[:280]

        metadata: Dict[str, Any] = {
            "path": rel,
            "tags": frontmatter.get("tags") if isinstance(frontmatter.get("tags"), list) else [],
        }
        # Carry a couple of common frontmatter keys at the top level of metadata
        # for the detail panel without polluting the node shape.
        for key in ("author", "date", "category", "type"):
            val = frontmatter.get(key)
            if val is not None:
                metadata[key] = val

        created = (
            datetime.fromtimestamp(stat.st_ctime, tz=timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            )
            if stat.st_ctime
            else None
        )
        updated = (
            datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            )
            if stat.st_mtime
            else None
        )

        import json as _json

        conn.execute(
            """
            INSERT OR REPLACE INTO kg_nodes
                (id, source, kind, title, preview, metadata, created_at, updated_at)
            VALUES (?, 'obsidian', 'note', ?, ?, ?, ?, ?)
            """,
            (
                node_id,
                title,
                preview,
                _json.dumps(metadata),
                created,
                updated,
            ),
        )
        node_count += 1

        # Wikilinks → edges of kind 'wikilink'
        for link in parse_wikilinks(body + "\n" + text[:0]):
            target_id = _obsidian_target_id(vault, link["target"])
            conn.execute(
                """
                INSERT OR REPLACE INTO kg_edges (source, target, kind, weight, context)
                VALUES (?, ?, 'wikilink', 1.0, ?)
                """,
                (node_id, target_id, link["alias"] or link["heading"] or None),
            )
            edge_count += 1

        # Inline tags → edges of kind 'tag' to a synthetic tag node
        body_for_tags = body + "\n" + (
            " ".join(metadata["tags"]) if metadata.get("tags") else ""
        )
        for tag in parse_inline_tags(body_for_tags):
            seen_tags.add(tag)
            tag_node = _tag_node_id("obsidian", tag)
            conn.execute(
                """
                INSERT OR IGNORE INTO kg_nodes
                    (id, source, kind, title, preview, metadata, created_at, updated_at)
                VALUES (?, 'obsidian', 'tag', ?, ?, '{}', NULL, NULL)
                """,
                (tag_node, f"#{tag}", f"Inline tag across {len(files)} files"),
            )
            tag_count += 1
            conn.execute(
                """
                INSERT OR REPLACE INTO kg_edges (source, target, kind, weight, context)
                VALUES (?, ?, 'tag', 1.0, NULL)
                """,
                (node_id, tag_node),
            )
            edge_count += 1

        done += 1
        if progress_cb:
            try:
                progress_cb(done, total)
            except Exception:
                pass

    conn.execute(
        "UPDATE sources SET node_count=?, last_sync=? WHERE id='obsidian'",
        (node_count, _now_iso()),
    )
    return {"files": done, "nodes": node_count, "edges": edge_count, "tags": tag_count}


# -----------------------------------------------------------------------------
# Background job runner
# -----------------------------------------------------------------------------


_JOBS_LOCK = asyncio.Lock()


async def _run_reindex(job_id: str, source: str, db_path: Path) -> None:
    """Run a reindex in the background; updates the ``jobs`` row as it goes."""

    async with _JOBS_LOCK:
        try:
            with _get_conn(db_path) as conn:
                conn.execute(
                    "INSERT OR REPLACE INTO jobs(job_id, source, status, progress, started_at) "
                    "VALUES (?, ?, 'running', 0.0, ?)",
                    (job_id, source, _now_iso()),
                )

                loop = asyncio.get_running_loop()

                def progress_cb(done: int, total: int) -> None:
                    pct = (done / total) if total else 1.0
                    # Persist from the executor thread without blocking the loop.
                    loop.call_soon_threadsafe(
                        _update_job_progress_sync,
                        db_path,
                        job_id,
                        pct,
                    )

                try:
                    await loop.run_in_executor(
                        None,
                        lambda: index_obsidian_vault(
                            _connect(db_path), progress_cb=progress_cb
                        ),
                    )
                    _update_job_status(db_path, job_id, "done", 1.0)
                except Exception as exc:
                    _log.exception("reindex failed")
                    _update_job_status(db_path, job_id, "error", 1.0, message=str(exc))
        except Exception as exc:
            _log.exception("reindex runner crashed")
            _update_job_status(db_path, job_id, "error", 1.0, message=str(exc))


def _update_job_progress_sync(db_path: Path, job_id: str, progress: float) -> None:
    """Synchronous helper called via ``loop.call_soon_threadsafe`` from the
    executor thread. Opens a fresh connection because SQLite connections
    are not thread-safe by default."""

    try:
        with _get_conn(db_path) as conn:
            conn.execute(
                "UPDATE jobs SET progress=? WHERE job_id=? AND status='running'",
                (progress, job_id),
            )
    except Exception as exc:
        _log.warning("progress update failed for %s: %s", job_id, exc)


def _update_job_status(
    db_path: Path,
    job_id: str,
    status: str,
    progress: Optional[float] = None,
    message: Optional[str] = None,
) -> None:
    try:
        with _get_conn(db_path) as conn:
            if progress is None and message is None:
                conn.execute(
                    "UPDATE jobs SET status=?, ended_at=? WHERE job_id=?",
                    (status, _now_iso(), job_id),
                )
            elif message is not None:
                conn.execute(
                    "UPDATE jobs SET status=?, progress=COALESCE(?,progress), "
                    "message=?, ended_at=? WHERE job_id=?",
                    (status, progress, message, _now_iso(), job_id),
                )
            else:
                conn.execute(
                    "UPDATE jobs SET status=?, progress=COALESCE(?, progress), "
                    "ended_at=? WHERE job_id=?",
                    (status, progress, _now_iso(), job_id),
                )
    except Exception as exc:
        _log.warning("status update failed for %s: %s", job_id, exc)


# -----------------------------------------------------------------------------
# FastAPI router
# -----------------------------------------------------------------------------

router = APIRouter()

# CORS note: the dashboard makes plugin API calls same-origin (the
# dashboard SPA and the API share the FastAPI host), so we follow the
# ``kanban`` plugin's approach and don't add a per-router CORS layer
# (APIRouter doesn't support ``add_middleware`` anyway — CORS would have
# to live on the parent app). If you ever call these endpoints from a
# different origin, add a CORSMiddleware on the dashboard's FastAPI
# instance instead of here.


def _db_path() -> Path:
    override = os.environ.get("KG_DB_PATH", "").strip()
    if override:
        return Path(override).expanduser()
    return DB_PATH_DEFAULT


# -----------------------------------------------------------------------------
# GET /health
# -----------------------------------------------------------------------------


@router.get("/health", response_model=KgHealth)
def get_health() -> KgHealth:
    """Cheap endpoint for the dashboard to check that the plugin is alive
    and which sources are reachable."""

    sources: Dict[str, bool] = {}
    try:
        with _get_conn(_db_path()) as conn:
            for row in conn.execute(
                "SELECT id, enabled FROM sources"
            ).fetchall():
                sources[row["id"]] = bool(row["enabled"])
    except Exception:
        for sid in SOURCE_IDS:
            sources[sid] = False
    return KgHealth(status="ok", version=PLUGIN_VERSION, sources=sources)


# -----------------------------------------------------------------------------
# GET /sources
# -----------------------------------------------------------------------------


@router.get("/sources", response_model=List[KgSource])
def list_sources() -> List[KgSource]:
    """Return the discoverable state of each known source."""

    out: List[KgSource] = []
    try:
        with _get_conn(_db_path()) as conn:
            rows = conn.execute(
                "SELECT id, enabled, node_count, last_sync FROM sources"
            ).fetchall()
            for row in rows:
                out.append(
                    KgSource(
                        id=row["id"],
                        enabled=bool(row["enabled"]),
                        node_count=row["node_count"] or 0,
                        last_sync=row["last_sync"],
                    )
                )
    except Exception as exc:
        _log.warning("list_sources failed: %s", exc)
    # Make sure every known id is represented even if the DB is empty.
    known = {s.id: s for s in out}
    for sid in SOURCE_IDS:
        if sid not in known:
            out.append(
                KgSource(id=sid, enabled=(sid == "obsidian"), node_count=0, last_sync=None)
            )
    return out


# -----------------------------------------------------------------------------
# GET /graph
# -----------------------------------------------------------------------------


@router.get("/graph")
def get_graph(
    source: str = Query(..., description="Source id (e.g. 'obsidian')"),
    limit: int = Query(500, ge=1, le=5000),
) -> Dict[str, List]:
    """Return up to ``limit`` nodes (plus their incident edges) for a
    given ``source``. Sources that aren't enabled return empty graphs
    instead of 404 so the UI can show a graceful empty state."""

    if source not in SOURCE_IDS:
        raise HTTPException(status_code=400, detail=f"Unknown source '{source}'")

    nodes: List[KgNode] = []
    edges: List[KgEdge] = []
    db = _db_path()

    if source == "obsidian":
        try:
            with _get_conn(db) as conn:
                node_rows = conn.execute(
                    "SELECT * FROM kg_nodes WHERE source=? ORDER BY updated_at DESC LIMIT ?",
                    (source, limit),
                ).fetchall()
                ids = [r["id"] for r in node_rows]
                if ids:
                    placeholders = ",".join("?" * len(ids))
                    edge_rows = conn.execute(
                        f"SELECT * FROM kg_edges WHERE source IN ({placeholders}) "
                        f"OR target IN ({placeholders})",
                        (*ids, *ids),
                    ).fetchall()
                else:
                    edge_rows = []
                for r in node_rows:
                    nodes.append(_row_to_node(r).model_dump())
                for r in edge_rows:
                    edges.append(_row_to_edge(r).model_dump())
        except Exception as exc:
            _log.warning("get_graph failed: %s", exc)
            raise HTTPException(status_code=500, detail=str(exc))
    # gbrain and hermes intentionally return empty until phase 2
    return {"nodes": nodes, "edges": edges}


# -----------------------------------------------------------------------------
# GET /node/{node_id}
# -----------------------------------------------------------------------------


@router.get("/node/{node_id:path}")
def get_node(node_id: str) -> Dict[str, Any]:
    """Return a single node plus its incoming / outgoing edges."""

    try:
        with _get_conn(_db_path()) as conn:
            row = conn.execute(
                "SELECT * FROM kg_nodes WHERE id=?", (node_id,)
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="node not found")
            node = _row_to_node(row).model_dump()
            in_rows = conn.execute(
                "SELECT * FROM kg_edges WHERE target=?", (node_id,)
            ).fetchall()
            out_rows = conn.execute(
                "SELECT * FROM kg_edges WHERE source=?", (node_id,)
            ).fetchall()
            return {
                "node": node,
                "incoming": [_row_to_edge(r).model_dump() for r in in_rows],
                "outgoing": [_row_to_edge(r).model_dump() for r in out_rows],
            }
    except HTTPException:
        raise
    except Exception as exc:
        _log.warning("get_node failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# -----------------------------------------------------------------------------
# GET /search
# -----------------------------------------------------------------------------


@router.get("/search")
def search(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=500),
    source: Optional[str] = Query(None, description="Optional source filter"),
) -> Dict[str, Any]:
    """Case-insensitive substring search over node titles + preview,
    optionally filtered by ``source``."""

    pattern = f"%{q}%"
    results: List[KgNode] = []
    total = 0
    try:
        with _get_conn(_db_path()) as conn:
            if source:
                rows = conn.execute(
                    """
                    SELECT * FROM kg_nodes
                    WHERE source=? AND (title LIKE ? OR preview LIKE ?)
                    ORDER BY updated_at DESC
                    LIMIT ?
                    """,
                    (source, pattern, pattern, limit),
                ).fetchall()
                total = conn.execute(
                    """
                    SELECT COUNT(*) FROM kg_nodes
                    WHERE source=? AND (title LIKE ? OR preview LIKE ?)
                    """,
                    (source, pattern, pattern),
                ).fetchone()[0]
            else:
                rows = conn.execute(
                    """
                    SELECT * FROM kg_nodes
                    WHERE title LIKE ? OR preview LIKE ?
                    ORDER BY updated_at DESC
                    LIMIT ?
                    """,
                    (pattern, pattern, limit),
                ).fetchall()
                total = conn.execute(
                    "SELECT COUNT(*) FROM kg_nodes WHERE title LIKE ? OR preview LIKE ?",
                    (pattern, pattern),
                ).fetchone()[0]
            for r in rows:
                results.append(_row_to_node(r).model_dump())
    except Exception as exc:
        _log.warning("search failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
    return {"results": [n.model_dump() for n in results], "total": total}


# -----------------------------------------------------------------------------
# POST /reindex
# -----------------------------------------------------------------------------


@router.post("/reindex")
async def post_reindex(source: Optional[str] = Query(None)) -> Dict[str, str]:
    """Kick off a reindex in the background and return its ``job_id``.

    Without a ``source`` arg we reindex every known source. In phase 1
    only ``obsidian`` actually moves; ``gbrain`` / ``hermes`` short-circuit
    to a "done" job that records no progress."""

    job_id = uuid.uuid4().hex
    targets: List[str]
    if source:
        if source not in SOURCE_IDS:
            raise HTTPException(status_code=400, detail=f"Unknown source '{source}'")
        targets = [source]
    else:
        targets = list(SOURCE_IDS)

    asyncio.create_task(_run_indexer(job_id, targets))
    return {"job_id": job_id}


async def _run_indexer(job_id: str, sources: List[str]) -> None:
    db = _db_path()
    for source in sources:
        if source == "obsidian":
            await _run_reindex(job_id + "-" + source, "obsidian", db)
        else:
            # No-op for unsupported sources; record a done job so the
            # UI gets a sane status response.
            try:
                with _get_conn(db) as conn:
                    conn.execute(
                        "INSERT OR REPLACE INTO jobs(job_id, source, status, progress, "
                        "started_at, ended_at, message) VALUES (?, ?, 'done', 1.0, ?, ?, ?)",
                        (
                            job_id + "-" + source,
                            source,
                            _now_iso(),
                            _now_iso(),
                            f"{source} not yet implemented",
                        ),
                    )
            except Exception:
                pass


# -----------------------------------------------------------------------------
# GET /reindex/{job_id}
# -----------------------------------------------------------------------------


@router.get("/reindex/{job_id}")
def get_reindex(job_id: str) -> Dict[str, Any]:
    """Poll for a reindex job's status, progress, and any error message."""

    try:
        # ``job_id`` can be either a full UUID or one of the per-source
        # composite ids we synthesise; we look them up by exact match.
        with _get_conn(_db_path()) as conn:
            row = conn.execute(
                "SELECT * FROM jobs WHERE job_id=?",
                (job_id,),
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="job not found")
            return {
                "job_id": row["job_id"],
                "source": row["source"],
                "status": row["status"],
                "progress": row["progress"],
                "message": row["message"],
                "started_at": row["started_at"],
                "ended_at": row["ended_at"],
            }
    except HTTPException:
        raise
    except Exception as exc:
        _log.warning("get_reindex failed: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# -----------------------------------------------------------------------------
# Tests (run with ``pytest plugins/knowledge-graph/dashboard/`` from repo root)
# -----------------------------------------------------------------------------

# Lightweight fixtures used by the inline pytest collection below. We
# expose them at module level so a `pytest` invocation from repo root
# picks them up without needing a tests/ directory.

def _tmp_vault(tmp_path) -> Path:
    """Build a tiny Obsidian-shaped vault with two notes that link to
    each other and a third note that uses a tag."""

    vault = tmp_path / "vault"
    vault.mkdir()
    (vault / "a.md").write_text(
        "---\n"
        "title: Alpha\n"
        "tags: [philosophy]\n"
        "---\n"
        "# Alpha\n\n"
        "Alpha links to [[b]] and uses #ideas inline. It also mentions [[c#Heading]].\n",
        encoding="utf-8",
    )
    (vault / "b.md").write_text(
        "---\ntitle: Beta\n---\n\n# Beta\n\nBack to [[a]].\n",
        encoding="utf-8",
    )
    (vault / "skip.txt").write_text("not markdown, ignore me", encoding="utf-8")
    return vault


def test_parse_wikilinks_basic():
    text = "Links to [[b]] and [[c#Heading]] and [[d|Alias]] and [[]]."
    links = parse_wikilinks(text)
    targets = {l["target"] for l in links}
    assert "b" in targets
    assert "c" in targets
    assert "d" in targets
    # empty target -> ignored
    assert "" not in targets
    # alias does NOT replace the target
    assert all(l["alias"] in (None, "", "Alias") for l in links)


def test_parse_inline_tags_excludes_code():
    text = "Real tag #ideas and a fake one #not-a-tag in code ```#fakecode``` plus a heading `# heading`."
    tags = parse_inline_tags(text)
    assert "ideas" in tags
    assert "fakecode" not in tags
    # Heading-prefixed line must not register as a tag
    assert "heading" not in tags


def test_index_obsidian_vault_end_to_end(tmp_path):
    """Index a synthetic vault and assert the expected nodes/edges exist."""

    vault = _tmp_vault(tmp_path)
    db = tmp_path / "kg.db"

    with _get_conn(db) as conn:
        stats = index_obsidian_vault(conn, vault_path=str(vault))
    assert stats["files"] == 2  # only the two .md files
    assert stats["nodes"] >= 2
    assert stats["edges"] >= 2

    # Read back the actual node ids so the assertions below can verify
    # structural properties without hard-coding the vault name.
    with _get_conn(db) as conn:
        sources = {
            r["id"]: dict(r)
            for r in conn.execute("SELECT * FROM sources").fetchall()
        }
        node_rows = list(conn.execute("SELECT * FROM kg_nodes").fetchall())
        nodes = {r["id"]: _row_to_node(r) for r in node_rows}
        edges = list(conn.execute("SELECT * FROM kg_edges").fetchall())

    assert sources["obsidian"]["node_count"] >= 2
    assert sources["obsidian"]["last_sync"] is not None

    # The two notes must exist as 'note' nodes
    note_ids = {
        r["id"]
        for r in node_rows
        if dict(r)["kind"] == "note"
    }
    assert len(note_ids) == 2

    # Wikilink edge from a -> b
    a_id = next(rid for rid in note_ids if rid.endswith("a.md"))
    b_id = next(rid for rid in note_ids if rid.endswith("b.md"))
    a_to_b = [
        e for e in edges
        if e["source"] == a_id and e["target"] == b_id and e["kind"] == "wikilink"
    ]
    assert a_to_b, f"missing a->b wikilink edge; got {edges!r}"
    # Reverse direction too (b mentions a)
    b_to_a = [
        e for e in edges
        if e["source"] == b_id and e["target"] == a_id and e["kind"] == "wikilink"
    ]
    assert b_to_a, f"missing b->a wikilink edge"

    # Dangling target c#Heading → node id with c.md (target normalisation)
    a_to_c = [
        e for e in edges
        if e["source"] == a_id and e["target"].endswith("c.md")
        and e["kind"] == "wikilink"
    ]
    assert a_to_c, f"missing a->c dangling wikilink"
    assert a_to_c[0]["context"] == "Heading"

    # Tag edge from a → #ideas synthetic tag node
    tag_node = _tag_node_id("obsidian", "ideas")
    assert tag_node in nodes
    a_to_tag = [
        e for e in edges
        if e["source"] == a_id and e["target"] == tag_node and e["kind"] == "tag"
    ]
    assert a_to_tag, f"missing a->#ideas tag edge"
