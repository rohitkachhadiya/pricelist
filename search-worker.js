let rows = [];
let normalizedAll = [];

const columns = [
  "Divison",
  "Category",
  "Item Code",
  "Item Description",
  "SDP",
  "NRP",
  "MRP",
  "Discount 21.18%",
  "Discount"
];

const normalize = value => String(value ?? "").toLowerCase();

self.onmessage = event => {
  const message = event.data;

  if (message.type === "load") {
    rows = Array.isArray(message.data) ? message.data : [];
    normalizedAll = new Array(rows.length);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let combined = "";

      for (let c = 0; c < columns.length; c++) {
        combined += normalize(row[columns[c]]) + "\u0001";
      }

      normalizedAll[i] = combined;
    }

    self.postMessage({
      type: "loaded",
      count: rows.length
    });
    return;
  }

  if (message.type === "search") {
    const term = normalize(message.term);

    if (term.length < 3) {
      self.postMessage({
        type: "results",
        indices: [],
        requestId: message.requestId
      });
      return;
    }

    const indices = [];

    for (let i = 0; i < normalizedAll.length; i++) {
      if (normalizedAll[i].includes(term)) {
        indices.push(i);
      }
    }

    self.postMessage({
      type: "results",
      indices,
      requestId: message.requestId
    });
  }
};
