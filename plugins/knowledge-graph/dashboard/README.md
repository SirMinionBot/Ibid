# Knowledge Graph Plugin

Visualize and search your knowledge across Obsidian vaults, gbrain pages, and Hermes skills, all from one panel in the Hermes dashboard.

## What it does

- Indexes an Obsidian vault (wikilinks, tags, frontmatter) into a local SQLite database.
- Lists every node in a sortable, filterable table.
- Opens a slide-in detail panel on click with the node preview, metadata, and incoming/outgoing edges.
- Lets you toggle which sources are loaded into the current view.
- Triggers a reindex on demand.

## Sources

| Source   | Status         | Notes |
|----------|----------------|-------|
| obsidian | ✅ implemented | Recursive .md scan, wikilinks (`[[Page]]`, `[[Page#Heading]]`, `[[Page\|Alias]]`), inline `#tag`, YAML frontmatter. |
| gbrain   | 🚧 planned    | Will pull pages from the gbrain MCP server. |
| hermes   | 🚧 planned    | Will pull skills + plugins from `~/.hermes/`. |

## Configuration

Set the Obsidian vault path via environment variable before launching the dashboard:

```bash
export KG_OBSIDIAN_VAULT=~/proyectos/codigosinsiesta
hermes dashboard --port 9119
```

Defaults to `~/proyectos/codigosinsiesta` if unset.

Other overrides:

| Env var        | Default                       | Purpose |
|----------------|-------------------------------|---------|
| `KG_OBSIDIAN_VAULT` | `~/proyectos/codigosinsiesta` | Path to the vault root |
| `KG_DB_PATH`    | `~/.hermes/knowledge-graph.db` | SQLite database location |

## Endpoints

All endpoints are mounted at `/api/plugins/knowledge-graph/` by the dashboard plugin system.

| Method | Path                | Purpose |
|--------|---------------------|---------|
| GET    | `/health`           | Service status and which sources are enabled. |
| GET    | `/sources`          | Source list with `node_count` and `last_sync` timestamp. |
| GET    | `/graph?source=X&limit=N` | Top-N nodes + edges for a given source. |
| GET    | `/node/{id}`        | Full node + incoming + outgoing edges. |
| GET    | `/search?q=...`     | LIKE-based title + preview search. |
| POST   | `/reindex`          | Kicks off an async reindex job, returns `job_id`. |
| GET    | `/reindex/{job_id}` | Polls job status (`running` / `done` / `error`) and `progress` (0.0 → 1.0). |

## Views

| View     | Status         |
|----------|----------------|
| Table    | ✅ shipped      |
| Graph    | 🚧 placeholder (Cytoscape.js planned) |
| Timeline | 🚧 placeholder |

## Development

The frontend is a plain IIFE (`dist/index.js`) with no build step. It consumes the host dashboard's `window.__HERMES_PLUGIN_SDK__` for React, shadcn primitives, and auth'd fetch.

The backend (`plugin_api.py`) is auto-discovered and mounted by `hermes_cli/web_server.py::_mount_plugin_api_routes`. See the kanban plugin (`plugins/kanban/dashboard/`) for the canonical example of this pattern.

## Tests

```bash
python3 -m pytest plugins/knowledge-graph/dashboard/plugin_api.py -v
```

## Roadmap

- Graph view (force-directed layout with Cytoscape.js).
- Timeline view (creation / update events).
- gbrain source (pull from gbrain MCP).
- Hermes skills source.
- Incremental index updates (watchdog on the vault directory).
- Full-text search (FTS5) instead of LIKE.
- Click-to-navigate from edge preview to target node.