// SRM Full Stack Challenge - POST /bfhl  (Node.js + Express)
// Deploy this to Heroku / Render / Railway. Submit the base URL in Q9.

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// ---- Identity fields (real values) ----
const USER_ID = "khushikumari_05022004";
const EMAIL_ID = "kk5504@srmist.edu.in";
const COLLEGE_ROLL_NUMBER = "RA2311003011224";

const EDGE_RE = /^([A-Z])->([A-Z])$/;

function processBfhl(dataList) {
  const invalid_entries = [];
  const duplicate_edges = [];
  const seenEdges = new Set();

  const parentOf = new Map(); // child -> parent (first wins)
  const childrenOf = new Map(); // parent -> [children] insertion order
  const adjUndirected = new Map(); // node -> Set of neighbours
  const discoveryOrder = new Map(); // node -> first seen index
  const orderedNodes = [];

  const addNode = (n) => {
    if (!discoveryOrder.has(n)) {
      discoveryOrder.set(n, orderedNodes.length);
      orderedNodes.push(n);
      adjUndirected.set(n, new Set());
    }
  };

  for (const raw of dataList || []) {
    const s = typeof raw === "string" ? raw : String(raw);
    const m = s.match(EDGE_RE);
    if (!m) {
      invalid_entries.push(s);
      continue;
    }
    const [_, parent, child] = m;

    if (seenEdges.has(s)) {
      duplicate_edges.push(s);
      continue;
    }
    seenEdges.add(s);

    addNode(parent);
    addNode(child);
    adjUndirected.get(parent).add(child);
    adjUndirected.get(child).add(parent);

    if (!parentOf.has(child)) {
      parentOf.set(child, parent);
      if (!childrenOf.has(parent)) childrenOf.set(parent, []);
      childrenOf.get(parent).push(child);
    }
  }

  // Connected components via BFS (discovery order)
  const visited = new Set();
  const components = [];
  for (const node of orderedNodes) {
    if (visited.has(node)) continue;
    const comp = [];
    const stack = [node];
    while (stack.length) {
      const x = stack.pop();
      if (visited.has(x)) continue;
      visited.add(x);
      comp.push(x);
      for (const nb of adjUndirected.get(x) || []) {
        if (!visited.has(nb)) stack.push(nb);
      }
    }
    components.push(comp);
  }

  // Sort components by earliest node discovery
  components.sort((a, b) => {
    const ai = Math.min(...a.map((n) => discoveryOrder.get(n)));
    const bi = Math.min(...b.map((n) => discoveryOrder.get(n)));
    return ai - bi;
  });

  const hierarchies = [];

  for (const comp of components) {
    const compSet = new Set(comp);

    const rootsNoParent = comp.filter((n) => !parentOf.has(n));
    let root, pureCycle;
    if (rootsNoParent.length) {
      root = rootsNoParent.reduce((a, b) =>
        discoveryOrder.get(a) <= discoveryOrder.get(b) ? a : b
      );
      pureCycle = false;
    } else {
      root = [...comp].sort()[0];
      pureCycle = true;
    }

    // Cycle detection via DFS 3-coloring on directed children graph
    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map(comp.map((n) => [n, WHITE]));

    function dfsHasCycle(start) {
      const stack = [[start, (childrenOf.get(start) || [])[Symbol.iterator]()]];
      color.set(start, GRAY);
      while (stack.length) {
        const top = stack[stack.length - 1];
        const [node, it] = top;
        const nxt = it.next();
        if (nxt.done) {
          color.set(node, BLACK);
          stack.pop();
          continue;
        }
        const v = nxt.value;
        if (!color.has(v)) continue;
        if (color.get(v) === GRAY) return true;
        if (color.get(v) === WHITE) {
          color.set(v, GRAY);
          stack.push([v, (childrenOf.get(v) || [])[Symbol.iterator]()]);
        }
      }
      return false;
    }

    let hasCycle = false;
    if (pureCycle) {
      hasCycle = true;
    } else {
      if (dfsHasCycle(root)) hasCycle = true;
      else {
        for (const n of comp) {
          if (color.get(n) === WHITE) {
            if (dfsHasCycle(n)) { hasCycle = true; break; }
          }
        }
      }
    }

    if (hasCycle) {
      hierarchies.push({ root, tree: {}, has_cycle: true });
      continue;
    }

    // Build nested tree
    function buildTree(n, seen) {
      if (seen.has(n)) return {};
      seen.add(n);
      const obj = {};
      for (const c of childrenOf.get(n) || []) obj[c] = buildTree(c, seen);
      return obj;
    }
    const tree = { [root]: buildTree(root, new Set()) };

    // Longest root-to-leaf path (node count)
    function longestPath(n, seen) {
      if (seen.has(n)) return 0;
      seen.add(n);
      const kids = childrenOf.get(n) || [];
      if (!kids.length) { seen.delete(n); return 1; }
      let best = 0;
      for (const c of kids) best = Math.max(best, longestPath(c, seen));
      seen.delete(n);
      return 1 + best;
    }
    const depth = longestPath(root, new Set());

    hierarchies.push({ root, tree, depth });
  }

  const nonCyclic = hierarchies.filter((h) => !h.has_cycle);
  const total_trees = nonCyclic.length;
  const total_cycles = hierarchies.filter((h) => h.has_cycle).length;
  let largest_tree_root = "";
  if (nonCyclic.length) {
    nonCyclic.sort((a, b) => (b.depth - a.depth) || a.root.localeCompare(b.root));
    largest_tree_root = nonCyclic[0].root;
  }

  return {
    user_id: USER_ID,
    email_id: EMAIL_ID,
    college_roll_number: COLLEGE_ROLL_NUMBER,
    hierarchies,
    invalid_entries,
    duplicate_edges,
    summary: { total_trees, total_cycles, largest_tree_root },
  };
}

app.get("/", (_req, res) =>
  res.json({ status: "ok", endpoint: "POST /bfhl", user_id: USER_ID })
);

app.post("/bfhl", (req, res) => {
  try {
    const data = (req.body && req.body.data) || [];
    if (!Array.isArray(data)) {
      return res.status(400).json({ error: "'data' must be an array" });
    }
    return res.json(processBfhl(data));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Convenience: accept GET on /bfhl with a clear message
app.get("/bfhl", (_req, res) =>
  res.status(405).json({ error: "Use POST with JSON body {\"data\": [...]}" })
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`BFHL API listening on :${PORT}`));
