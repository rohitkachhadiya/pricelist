let rows = [];
let normalizedAll = [];
let normalizedColumns = {};
const columns = [
  "Divison","Category","Item Code","Item Description",
  "SDP","NRP","MRP","Discount 21.18%","Discount"
];

const norm = value => String(value ?? "").toLowerCase();

self.onmessage = async (event) => {
  const msg = event.data;

  if (msg.type === "load") {
    rows = msg.data || [];
    normalizedAll = new Array(rows.length);
    for (const col of columns) normalizedColumns[col] = new Array(rows.length);

    // Normalize once. Search operations then avoid repeated String()/toLowerCase().
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let all = "";
      for (const col of columns) {
        const value = norm(row[col]);
        normalizedColumns[col][i] = value;
        all += value + "\u0001";
      }
      normalizedAll[i] = all;
    }
    self.postMessage({type:"loaded", count:rows.length});
    return;
  }

  if (msg.type === "search") {
    const term = norm(msg.term);
    const column = msg.column;
    if (term.length < 3) {
      self.postMessage({type:"results", indices:[]});
      return;
    }

    const source = column === "all" ? normalizedAll : normalizedColumns[column];
    const indices = [];

    // Scan pre-normalized strings only. This is extremely cheap for ~60k rows.
    for (let i = 0; i < source.length; i++) {
      if (source[i].includes(term)) indices.push(i);
    }

    self.postMessage({type:"results", indices});
  }
};
