/**
 * Hermes Knowledge Graph — Dashboard Plugin
 *
 * Visualize and search your knowledge across Obsidian vaults, gbrain pages,
 * and Hermes skills. Calls the plugin's backend at /api/plugins/knowledge-graph/
 * which indexes Obsidian vaults into SQLite on first request.
 *
 * Plain IIFE, no build step. Uses window.__HERMES_PLUGIN_SDK__ for React +
 * shadcn primitives.
 */
(function () {
  "use strict";

  const SDK = window.__HERMES_PLUGIN_SDK__;
  if (!SDK) return;

  const React = SDK.React;
  const h = React.createElement;
  const { useState, useEffect, useMemo } = SDK.hooks;
  const { cn, isoTimeAgo } = SDK.utils;

  const SDK_components = SDK.components || {};
  const Card = SDK_components.Card || function (props) {
    return h("div", { className: cn("rounded-lg border border-border bg-card", props.className) }, props.children);
  };
  const CardContent = SDK_components.CardContent || function (props) {
    return h("div", { className: cn("p-4", props.className) }, props.children);
  };
  const Badge = SDK_components.Badge || function (props) {
    return h("span", { className: cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-card text-text-primary", props.className) }, props.children);
  };
  const Button = SDK_components.Button || function (props) {
    const variant = props.variant || "default";
    const base = "inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors px-3 py-1.5 disabled:pointer-events-none disabled:opacity-50";
    const variants = {
      default: "bg-brand text-brand-foreground hover:opacity-90",
      outline: "border border-border bg-transparent hover:bg-card",
      ghost: "bg-transparent hover:bg-card",
    };
    return h("button", Object.assign({
      type: "button",
      onClick: props.onClick,
      disabled: props.disabled,
      className: cn(base, variants[variant] || variants.default, props.className),
    }, { title: props.title }), props.children);
  };
  const Input = SDK_components.Input || function (props) {
    return h("input", Object.assign({
      type: "text",
      value: props.value || "",
      onChange: props.onChange,
      placeholder: props.placeholder,
      className: cn("flex h-9 w-full rounded-md border border-border bg-bg-base-100 px-3 py-1 text-sm placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand", props.className),
    }));
  };

  const API = "/api/plugins/knowledge-graph";

  // ---- Source badge colour (semantic tokens, opacity >= 0.7) ----
  function sourceColor(src) {
    if (src === "obsidian") return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
    if (src === "gbrain") return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    if (src === "hermes") return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    return "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  }

  // ---- Detail panel ----
  function DetailPanel(props) {
    const { node, onClose, edges } = props;
    const incoming = edges.filter(function (e) { return e.target === node.id; });
    const outgoing = edges.filter(function (e) { return e.source === node.id; });

    return h("div", { className: "hermes-kg-detail-overlay", onClick: onClose },
      h("div", { className: "hermes-kg-detail-panel", onClick: function (e) { e.stopPropagation(); } },
        h("div", { className: "flex items-start justify-between mb-4 gap-2" },
          h("div", { className: "flex-1 min-w-0" },
            h("h2", { className: "text-lg font-semibold truncate" }, node.title || node.id),
            h("div", { className: "flex gap-2 mt-2 flex-wrap" },
              h("span", { className: cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", sourceColor(node.source)) }, node.source),
              h("span", { className: "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-card text-text-secondary border border-border" }, node.kind)
            )
          ),
          h(Button, { size: "sm", variant: "ghost", onClick: onClose, title: "Close" }, "✕")
        ),
        h("div", { className: "text-xs text-text-secondary mb-4 font-mono break-all" }, node.id),
        node.preview ? h("div", { className: "hermes-kg-detail-preview text-sm whitespace-pre-wrap mb-4" }, node.preview) : null,
        node.metadata && Object.keys(node.metadata).length > 0 ? h("div", { className: "hermes-kg-detail-meta mb-4" },
          h("div", { className: "text-xs font-medium mb-2 text-text-primary" }, "Metadata"),
          h("div", { className: "flex flex-col gap-1" },
            Object.keys(node.metadata).map(function (k) {
              return h("div", { key: k, className: "flex gap-2 text-xs" },
                h("span", { className: "text-text-secondary min-w-[100px] shrink-0" }, k + ":"),
                h("span", { className: "text-text-primary break-all" }, String(node.metadata[k]))
              );
            })
          )
        ) : null,
        h("div", { className: "grid grid-cols-2 gap-4" },
          incoming.length > 0 ? h("div", null,
            h("div", { className: "text-xs font-medium mb-2 text-text-primary" }, "Incoming (" + incoming.length + ")"),
            h("div", { className: "flex flex-col gap-1" },
              incoming.slice(0, 20).map(function (e, i) {
                return h("div", { key: i, className: "text-xs text-text-secondary font-mono truncate" }, "← " + e.source + " · " + e.kind);
              }),
              incoming.length > 20 ? h("div", { className: "text-xs text-text-secondary italic" }, "+ " + (incoming.length - 20) + " more") : null
            )
          ) : null,
          outgoing.length > 0 ? h("div", null,
            h("div", { className: "text-xs font-medium mb-2 text-text-primary" }, "Outgoing (" + outgoing.length + ")"),
            h("div", { className: "flex flex-col gap-1" },
              outgoing.slice(0, 20).map(function (e, i) {
                return h("div", { key: i, className: "text-xs text-text-secondary font-mono truncate" }, "→ " + e.target + " · " + e.kind);
              }),
              outgoing.length > 20 ? h("div", { className: "text-xs text-text-secondary italic" }, "+ " + (outgoing.length - 20) + " more") : null
            )
          ) : null
        )
      )
    );
  }

  // ---- Main page ----
  function KnowledgeGraphPage() {
    const [sources, setSources] = useState([]);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [selectedNode, setSelectedNode] = useState(null);
    const [search, setSearch] = useState("");
    const [enabledSources, setEnabledSources] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [reindexing, setReindexing] = useState(false);
    const [activeView, setActiveView] = useState("table");
    const [sortBy, setSortBy] = useState("updated_at");
    const [sortDir, setSortDir] = useState("desc");

    // ---- Load sources on mount ----
    useEffect(function () {
      let cancelled = false;
      SDK.fetchJSON(API + "/sources")
        .then(function (s) {
          if (cancelled) return;
          setSources(s || []);
          // Pre-enable sources that have a non-zero node_count
          const enabled = new Set((s || []).filter(function (x) { return x.node_count > 0; }).map(function (x) { return x.id; }));
          setEnabledSources(enabled);
        })
        .catch(function (e) {
          if (!cancelled) setError(String(e && e.message ? e.message : e));
        })
        .finally(function () {
          if (!cancelled) setLoading(false);
        });
      return function () { cancelled = true; };
    }, []);

    // ---- Load graph whenever enabled sources change ----
    useEffect(function () {
      if (enabledSources.size === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      let cancelled = false;
      Promise.all(Array.from(enabledSources).map(function (src) {
        return SDK.fetchJSON(API + "/graph?source=" + encodeURIComponent(src) + "&limit=500").catch(function () { return { nodes: [], edges: [] }; });
      })).then(function (results) {
        if (cancelled) return;
        const allNodes = [];
        const allEdges = [];
        results.forEach(function (r) {
          (r.nodes || []).forEach(function (n) { allNodes.push(n); });
          (r.edges || []).forEach(function (e) { allEdges.push(e); });
        });
        setNodes(allNodes);
        setEdges(allEdges);
      });
      return function () { cancelled = true; };
    }, [enabledSources]);

    function toggleSource(id) {
      const next = new Set(enabledSources);
      if (next.has(id)) next.delete(id); else next.add(id);
      setEnabledSources(next);
    }

    function triggerReindex() {
      setReindexing(true);
      SDK.fetchJSON(API + "/reindex", { method: "POST" })
        .then(function (resp) {
          // Poll until done
          return pollJob(resp.job_id);
        })
        .then(function () {
          // Reload sources + graph
          return SDK.fetchJSON(API + "/sources");
        })
        .then(function (s) {
          setSources(s || []);
          setEnabledSources(new Set((s || []).filter(function (x) { return x.node_count > 0; }).map(function (x) { return x.id; })));
        })
        .catch(function (e) { setError(String(e && e.message ? e.message : e)); })
        .finally(function () { setReindexing(false); });
    }

    function pollJob(jobId) {
      return new Promise(function (resolve, reject) {
        const tick = function () {
          SDK.fetchJSON(API + "/reindex/" + encodeURIComponent(jobId))
            .then(function (s) {
              if (s.status === "done") return resolve(s);
              if (s.status === "error") return reject(new Error(s.message || "reindex failed"));
              setTimeout(tick, 500);
            })
            .catch(reject);
        };
        tick();
      });
    }

    function openNodeDetail(id) {
      SDK.fetchJSON(API + "/node/" + encodeURIComponent(id))
        .then(setSelectedNode)
        .catch(function (e) { setError(String(e && e.message ? e.message : e)); });
    }

    // ---- Derived: filtered + sorted ----
    const filteredNodes = useMemo(function () {
      if (!search) return nodes;
      const q = search.toLowerCase();
      return nodes.filter(function (n) {
        return ((n.title || "").toLowerCase().indexOf(q) >= 0) ||
               ((n.preview || "").toLowerCase().indexOf(q) >= 0);
      });
    }, [nodes, search]);

    const sortedNodes = useMemo(function () {
      const arr = filteredNodes.slice();
      arr.sort(function (a, b) {
        const av = a[sortBy] || "";
        const bv = b[sortBy] || "";
        let cmp;
        if (av < bv) cmp = -1; else if (av > bv) cmp = 1; else cmp = 0;
        return sortDir === "asc" ? cmp : -cmp;
      });
      return arr;
    }, [filteredNodes, sortBy, sortDir]);

    function inDegree(id) {
      let c = 0;
      for (let i = 0; i < edges.length; i++) if (edges[i].target === id) c++;
      return c;
    }
    function outDegree(id) {
      let c = 0;
      for (let i = 0; i < edges.length; i++) if (edges[i].source === id) c++;
      return c;
    }

    function toggleSort(col) {
      if (sortBy === col) {
        setSortDir(sortDir === "asc" ? "desc" : "asc");
      } else {
        setSortBy(col);
        setSortDir("desc");
      }
    }

    // ---- Render ----
    if (loading) {
      return h("div", { className: "p-8 text-sm text-text-secondary" }, "Loading knowledge graph...");
    }
    if (error) {
      return h("div", { className: "p-8" },
        h("div", { className: "text-sm text-destructive mb-2" }, "Error: " + error),
        h(Button, { size: "sm", variant: "outline", onClick: function () { setError(null); setLoading(true); window.location.reload(); } }, "Retry")
      );
    }

    return h("div", { className: "hermes-kg flex flex-col gap-4 p-4" },
      h("div", { className: "flex items-center justify-between flex-wrap gap-2" },
        h("div", null,
          h("h1", { className: "text-2xl font-semibold text-text-primary" }, "Knowledge Graph"),
          h("p", { className: "text-xs text-text-secondary mt-1" }, nodes.length + " nodes · " + edges.length + " edges · " + sources.length + " sources")
        ),
        h("div", { className: "flex gap-2 items-center" },
          h(Button, { size: "sm", variant: activeView === "table" ? "default" : "outline", onClick: function () { setActiveView("table"); } }, "Table"),
          h(Button, { size: "sm", variant: activeView === "graph" ? "default" : "outline", onClick: function () { setActiveView("graph"); }, disabled: true, title: "Coming soon" }, "Graph"),
          h(Button, { size: "sm", variant: activeView === "timeline" ? "default" : "outline", onClick: function () { setActiveView("timeline"); }, disabled: true, title: "Coming soon" }, "Timeline"),
          h(Button, { size: "sm", variant: "outline", onClick: triggerReindex, disabled: reindexing }, reindexing ? "Reindexing..." : "Reindex")
        )
      ),

      // Sources + Search
      h("div", { className: "flex flex-wrap gap-2 items-center" },
        sources.map(function (s) {
          const enabled = enabledSources.has(s.id);
          return h(Button, {
            key: s.id,
            size: "sm",
            variant: enabled ? "default" : "outline",
            onClick: function () { toggleSource(s.id); },
            title: (s.last_sync ? "Last sync: " + isoTimeAgo(s.last_sync) : "Never synced") + " · " + (s.node_count || 0) + " nodes",
          }, s.id + " · " + (s.node_count || 0));
        }),
        h("div", { className: "flex-1 min-w-[200px] ml-auto" },
          h(Input, {
            placeholder: "Search title or preview...",
            value: search,
            onChange: function (e) { setSearch(e.target.value); },
          })
        )
      ),

      // Active view
      activeView === "table" ? renderTable() : renderGraphPlaceholder(),

      // Detail overlay
      selectedNode ? h(DetailPanel, { node: selectedNode, onClose: function () { setSelectedNode(null); }, edges: edges }) : null
    );

    // ---- Table view ----
    function renderTable() {
      if (sortedNodes.length === 0) {
        return h(Card, null,
          h(CardContent, { className: "p-8 text-center" },
            h("div", { className: "text-sm text-text-secondary" }, "No nodes yet."),
            h("div", { className: "text-xs text-text-secondary mt-2" }, "Click Reindex to scan the Obsidian vault."),
            h("div", { className: "mt-4" },
              h(Button, { size: "sm", onClick: triggerReindex, disabled: reindexing }, reindexing ? "Reindexing..." : "Reindex now")
            )
          )
        );
      }
      const cols = [
        { key: "title", label: "Title", sortable: true },
        { key: "source", label: "Source", sortable: true },
        { key: "kind", label: "Kind", sortable: true },
        { key: "updated_at", label: "Updated", sortable: true },
        { key: "in", label: "In", sortable: false },
        { key: "out", label: "Out", sortable: false },
      ];
      return h(Card, null,
        h(CardContent, { className: "p-0" },
          h("div", { className: "hermes-kg-table-wrap" },
            h("table", { className: "hermes-kg-table" },
              h("thead", null,
                h("tr", null,
                  cols.map(function (col) {
                    const isActive = sortBy === col.key;
                    return h("th", {
                      key: col.key,
                      onClick: col.sortable ? function () { toggleSort(col.key); } : undefined,
                      className: cn(col.sortable && "cursor-pointer hover:text-text-primary", isActive && "text-text-primary"),
                    }, col.label + (isActive ? (sortDir === "asc" ? " ↑" : " ↓") : ""));
                  })
                )
              ),
              h("tbody", null,
                sortedNodes.map(function (n) {
                  return h("tr", {
                    key: n.id,
                    onClick: function () { openNodeDetail(n.id); },
                  },
                    h("td", null,
                      h("div", { className: "flex flex-col gap-0.5" },
                        h("span", { className: "text-sm font-medium text-text-primary truncate max-w-md" }, n.title || n.id),
                        n.preview ? h("span", { className: "text-xs text-text-secondary truncate max-w-md" }, (n.preview || "").slice(0, 100)) : null
                      )
                    ),
                    h("td", null,
                      h("span", { className: cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", sourceColor(n.source)) }, n.source)
                    ),
                    h("td", null,
                      h("span", { className: "text-xs text-text-secondary" }, n.kind)
                    ),
                    h("td", { className: "text-xs text-text-secondary whitespace-nowrap" },
                      n.updated_at ? isoTimeAgo(n.updated_at) : "—"
                    ),
                    h("td", { className: "text-xs text-text-secondary text-center" }, String(inDegree(n.id))),
                    h("td", { className: "text-xs text-text-secondary text-center" }, String(outDegree(n.id)))
                  );
                })
              )
            )
          )
        )
      );
    }

    function renderGraphPlaceholder() {
      return h(Card, null,
        h(CardContent, { className: "p-8 text-center" },
          h("div", { className: "text-sm text-text-secondary" }, "Graph view — coming soon (Cytoscape.js)"),
          h("div", { className: "text-xs text-text-secondary mt-2" }, nodes.length + " nodes would render here")
        )
      );
    }
  }

  // ---- Register ----
  if (window.__HERMES_PLUGINS__ && typeof window.__HERMES_PLUGINS__.register === "function") {
    window.__HERMES_PLUGINS__.register("knowledge-graph", KnowledgeGraphPage);
  }
})();