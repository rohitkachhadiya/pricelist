const PAGE_SIZE = 50;

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

let data = [];
let filteredIndices = [];
let currentPage = 1;
let requestId = 0;
let searchTimer = null;

const searchInput = document.getElementById("search");
const clearInput = document.getElementById("clearInput");
const resultsBody = document.getElementById("results");
const resultCount = document.getElementById("resultCount");
const hint = document.getElementById("hint");
const empty = document.getElementById("empty");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const recordInfo = document.getElementById("recordInfo");

// IMPORTANT: no reference to mobileResults.
// This fixes the previous:
// "Cannot set properties of null (setting 'innerHTML')"
const worker = new Worker("search-worker.js");

fetch("data.json", { cache: "default" })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Could not load data.json (${response.status})`);
    }
    return response.json();
  })
  .then(json => {
    data = Array.isArray(json) ? json : [];

    worker.postMessage({
      type: "load",
      data
    });
  })
  .catch(error => {
    resultCount.textContent = "Error loading data";
    hint.textContent = error.message;
    empty.textContent = "Check that data.json is in the same folder as index.html.";
  });

worker.onmessage = event => {
  const message = event.data;

  if (message.type === "loaded") {
    resultCount.textContent =
      `${message.count.toLocaleString()} records loaded`;

    hint.textContent = "Enter 3 or more characters to search.";

    render();
    return;
  }

  if (
    message.type === "results" &&
    message.requestId === requestId
  ) {
    filteredIndices = message.indices;
    currentPage = 1;

    resultCount.textContent =
      `${filteredIndices.length.toLocaleString()} matching record` +
      `${filteredIndices.length === 1 ? "" : "s"}`;

    hint.textContent = "Searching all columns.";

    render();
  }
};

function scheduleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 100);
}

function runSearch() {
  const term = searchInput.value.trim();

  if (term.length < 3) {
    requestId++;
    filteredIndices = [];
    currentPage = 1;

    resultCount.textContent =
      `${data.length.toLocaleString()} records loaded`;

    hint.textContent = "Enter 3 or more characters to search.";

    render();
    return;
  }

  const currentRequestId = ++requestId;

  worker.postMessage({
    type: "search",
    term,
    requestId: currentRequestId
  });
}

function render() {
  // The only results container is the actual table tbody.
  resultsBody.innerHTML = "";

  if (filteredIndices.length === 0) {
    empty.style.display = "block";
    empty.textContent =
      searchInput.value.trim().length >= 3
        ? "No matching records found."
        : "Enter a search term to see matching products.";

    pageInfo.textContent = "Page 0 of 0";
    recordInfo.textContent = "";
    prevBtn.disabled = true;
    nextBtn.disabled = true;

    return;
  }

  empty.style.display = "none";

  const totalPages = Math.ceil(
    filteredIndices.length / PAGE_SIZE
  );

  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PAGE_SIZE;
  const end = Math.min(
    start + PAGE_SIZE,
    filteredIndices.length
  );

  const fragment = document.createDocumentFragment();

  for (let position = start; position < end; position++) {
    const row = data[filteredIndices[position]];
    const tr = document.createElement("tr");

    for (const column of columns) {
      const td = document.createElement("td");
      td.textContent = row[column] ?? "";

      if (
        column === "SDP" ||
        column === "NRP" ||
        column === "MRP" ||
        column === "Discount 21.18%" ||
        column === "Discount"
      ) {
        td.classList.add("amount-cell");
      }

      if (
        column === "Discount 21.18%" ||
        column === "Discount"
      ) {
        td.classList.add("discount-cell");
      }

      tr.appendChild(td);
    }

    fragment.appendChild(tr);
  }

  resultsBody.appendChild(fragment);

  pageInfo.textContent =
    `Page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()}`;

  recordInfo.textContent =
    `Showing ${start + 1} to ${end} of ` +
    `${filteredIndices.length.toLocaleString()} records`;

  prevBtn.disabled = currentPage === 1;
  nextBtn.disabled = currentPage === totalPages;
}

searchInput.addEventListener("input", () => {
  clearInput.style.display =
    searchInput.value.length > 0 ? "block" : "none";

  scheduleSearch();
});

clearInput.addEventListener("click", () => {
  searchInput.value = "";
  clearInput.style.display = "none";

  requestId++;
  filteredIndices = [];
  currentPage = 1;

  resultCount.textContent =
    `${data.length.toLocaleString()} records loaded`;

  hint.textContent = "Enter 3 or more characters to search.";

  render();
  searchInput.focus();
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    render();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
});

nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(
    filteredIndices.length / PAGE_SIZE
  );

  if (currentPage < totalPages) {
    currentPage++;
    render();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
});
