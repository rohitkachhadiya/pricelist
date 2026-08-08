const PAGE_SIZE = 50;
const columns = [
  "Divison","Category","Item Code","Item Description",
  "SDP","NRP","MRP","Discount 21.18%","Discount"
];

let data = [];
let filteredIndices = [];
let currentPage = 1;
let searchTimer = null;
let requestId = 0;

const searchInput = document.getElementById("search");
const columnSelect = document.getElementById("column");
const clearBtn = document.getElementById("clearBtn");
const results = document.getElementById("results");
const resultCount = document.getElementById("resultCount");
const hint = document.getElementById("hint");
const empty = document.getElementById("empty");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const worker = new Worker("search-worker.js");

fetch("data.json", {cache:"default"})
  .then(r => {
    if (!r.ok) throw new Error("Could not load data.json");
    return r.json();
  })
  .then(json => {
    data = Array.isArray(json) ? json : [];
    worker.postMessage({type:"load", data});
  })
  .catch(err => {
    resultCount.textContent = "Error loading data";
    hint.textContent = err.message;
    empty.textContent = "Make sure data.json is beside index.html.";
    empty.style.display = "block";
  });

worker.onmessage = event => {
  const msg = event.data;

  if (msg.type === "loaded") {
    resultCount.textContent = `${msg.count.toLocaleString()} records loaded`;
    hint.textContent = "Enter 3 or more characters to search.";
    render();
    return;
  }

  if (msg.type === "results") {
    // Ignore stale worker responses if user typed again.
    if (msg.requestId !== undefined && msg.requestId !== requestId) return;
    filteredIndices = msg.indices;
    currentPage = 1;
    resultCount.textContent =
      `${filteredIndices.length.toLocaleString()} matching record${filteredIndices.length === 1 ? "" : "s"}`;
    hint.textContent = `Searching ${columnSelect.value === "all" ? "all columns" : columnSelect.value}.`;
    render();
  }
};

function doSearch() {
  const term = searchInput.value.trim();
  if (term.length < 3) {
    requestId++;
    filteredIndices = [];
    currentPage = 1;
    resultCount.textContent = `${data.length.toLocaleString()} records loaded`;
    hint.textContent = "Enter 3 or more characters to search.";
    render();
    return;
  }

  const id = ++requestId;
  worker.postMessage({
    type: "search",
    term,
    column: columnSelect.value,
    requestId: id
  });
}

// Small debounce prevents unnecessary searches while typing quickly.
function scheduleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(doSearch, 100);
}

function render() {
  results.innerHTML = "";

  if (filteredIndices.length === 0) {
    empty.style.display = "block";
    empty.textContent = searchInput.value.trim().length >= 3
      ? "No matching records found."
      : "Enter a search term to see matching products.";
    pageInfo.textContent = "Page 0 of 0";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  empty.style.display = "none";

  const totalPages = Math.ceil(filteredIndices.length / PAGE_SIZE);
  currentPage = Math.min(currentPage, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filteredIndices.length);

  const fragment = document.createDocumentFragment();

  for (let p = start; p < end; p++) {
    const row = data[filteredIndices[p]];
    const tr = document.createElement("tr");

    for (const col of columns) {
      const td = document.createElement("td");
      td.textContent = row[col] ?? "";
      tr.appendChild(td);
    }
    fragment.appendChild(tr);
  }

  results.appendChild(fragment);
  pageInfo.textContent = `Page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()}`;
  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

searchInput.addEventListener("input", scheduleSearch);
columnSelect.addEventListener("change", scheduleSearch);

clearBtn.addEventListener("click", () => {
  clearTimeout(searchTimer);
  searchInput.value = "";
  columnSelect.value = "all";
  requestId++;
  filteredIndices = [];
  currentPage = 1;
  resultCount.textContent = `${data.length.toLocaleString()} records loaded`;
  hint.textContent = "Enter 3 or more characters to search.";
  render();
  searchInput.focus();
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    render();
    window.scrollTo({top:0, behavior:"smooth"});
  }
});

nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(filteredIndices.length / PAGE_SIZE);
  if (currentPage < totalPages) {
    currentPage++;
    render();
    window.scrollTo({top:0, behavior:"smooth"});
  }
});
