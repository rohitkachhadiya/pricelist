const PAGE_SIZE=50;

const columns=[
  "Divison","Category","Item Code","Item Description",
  "SDP","NRP","MRP","Discount 21.18%","Discount"
];

let data=[];
let filteredIndices=[];
let currentPage=1;
let requestId=0;
let searchTimer=null;

const searchInput=document.getElementById("search");
const columnSelect=document.getElementById("column");
const searchBtn=document.getElementById("searchBtn");
const clearBtn=document.getElementById("clearBtn");
const clearInput=document.getElementById("clearInput");
const results=document.getElementById("results");
const resultCount=document.getElementById("resultCount");
const hint=document.getElementById("hint");
const empty=document.getElementById("empty");
const prevBtn=document.getElementById("prevBtn");
const nextBtn=document.getElementById("nextBtn");
const pageInfo=document.getElementById("pageInfo");
const recordInfo=document.getElementById("recordInfo");

const worker=new Worker("search-worker.js");

fetch("data.json")
  .then(r=>{
    if(!r.ok) throw new Error("Could not load data.json");
    return r.json();
  })
  .then(json=>{
    data=Array.isArray(json)?json:[];
    worker.postMessage({type:"load",data});
  })
  .catch(err=>{
    resultCount.textContent="Error loading data";
    hint.textContent=err.message;
  });

worker.onmessage=e=>{
  const m=e.data;

  if(m.type==="loaded"){
    resultCount.textContent=`${m.count.toLocaleString()} records loaded`;
    hint.textContent="Enter 3 or more characters to search.";
    render();
    return;
  }

  if(m.type==="results" && m.requestId===requestId){
    filteredIndices=m.indices;
    currentPage=1;

    resultCount.textContent=
      `${filteredIndices.length.toLocaleString()} matching record${filteredIndices.length===1?"":"s"}`;

    hint.textContent=
      `Searching ${columnSelect.value==="all"?"all columns":columnSelect.value}.`;

    render();
  }
};

function runSearch(){
  const term=searchInput.value.trim();

  clearTimeout(searchTimer);

  if(term.length<3){
    requestId++;
    filteredIndices=[];
    currentPage=1;

    resultCount.textContent=
      `${data.length.toLocaleString()} records loaded`;

    hint.textContent="Enter 3 or more characters to search.";
    render();
    return;
  }

  const id=++requestId;

  worker.postMessage({
    type:"search",
    term,
    column:columnSelect.value,
    requestId:id
  });
}

function scheduleSearch(){
  clearTimeout(searchTimer);
  searchTimer=setTimeout(runSearch,100);
}

function render(){
  results.innerHTML="";

  if(filteredIndices.length===0){
    empty.style.display="block";

    empty.textContent=
      searchInput.value.trim().length>=3
        ? "No matching records found."
        : "Enter a search term to see matching products.";

    pageInfo.textContent="Page 0 of 0";
    recordInfo.textContent="";
    prevBtn.disabled=true;
    nextBtn.disabled=true;
    return;
  }

  empty.style.display="none";

  const totalPages=Math.ceil(filteredIndices.length/PAGE_SIZE);

  currentPage=Math.min(currentPage,totalPages);

  const start=(currentPage-1)*PAGE_SIZE;
  const end=Math.min(start+PAGE_SIZE,filteredIndices.length);

  const fragment=document.createDocumentFragment();

  for(let p=start;p<end;p++){
    const row=data[filteredIndices[p]];
    const tr=document.createElement("tr");

    for(const column of columns){
      const td=document.createElement("td");
      td.textContent=row[column]??"";

      if(column==="Discount 21.18%" || column==="Discount"){
        td.classList.add("discount-cell");
      }

      tr.appendChild(td);
    }

    fragment.appendChild(tr);
  }

  results.appendChild(fragment);

  pageInfo.textContent=
    `Page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()}`;

  recordInfo.textContent=
    `Showing ${start+1} to ${end} of ${filteredIndices.length.toLocaleString()} records`;

  prevBtn.disabled=currentPage===1;
  nextBtn.disabled=currentPage===totalPages;
}

searchInput.addEventListener("input",()=>{
  clearInput.style.display=searchInput.value?"block":"none";
  scheduleSearch();
});

searchBtn.addEventListener("click",runSearch);

columnSelect.addEventListener("change",runSearch);

clearBtn.addEventListener("click",clearSearch);

clearInput.addEventListener("click",clearSearch);

function clearSearch(){
  clearTimeout(searchTimer);
  searchInput.value="";
  clearInput.style.display="none";
  columnSelect.value="all";
  requestId++;
  filteredIndices=[];
  currentPage=1;

  resultCount.textContent=
    `${data.length.toLocaleString()} records loaded`;

  hint.textContent="Enter 3 or more characters to search.";

  render();
  searchInput.focus();
}

prevBtn.addEventListener("click",()=>{
  if(currentPage>1){
    currentPage--;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
});

nextBtn.addEventListener("click",()=>{
  const totalPages=Math.ceil(filteredIndices.length/PAGE_SIZE);

  if(currentPage<totalPages){
    currentPage++;
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
});
