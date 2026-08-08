const PAGE_SIZE=50;
const columns=["Divison","Category","Item Code","Item Description","SDP","NRP","MRP","Discount 21.18%","Discount"];
let data=[],filteredIndices=[],currentPage=1,searchTimer=null,requestId=0;
const searchInput=document.getElementById("search"),columnSelect=document.getElementById("column"),clearBtn=document.getElementById("clearBtn");
const results=document.getElementById("results"),mobileResults=document.getElementById("mobileResults"),resultCount=document.getElementById("resultCount");
const hint=document.getElementById("hint"),empty=document.getElementById("empty"),prevBtn=document.getElementById("prevBtn"),nextBtn=document.getElementById("nextBtn"),pageInfo=document.getElementById("pageInfo");
const worker=new Worker("search-worker.js");

fetch("data.json").then(r=>{if(!r.ok)throw Error("Could not load data.json");return r.json()})
.then(json=>{data=Array.isArray(json)?json:[];worker.postMessage({type:"load",data})})
.catch(err=>{resultCount.textContent="Error loading data";hint.textContent=err.message;});

worker.onmessage=e=>{
 const m=e.data;
 if(m.type==="loaded"){resultCount.textContent=`${m.count.toLocaleString()} records loaded`;render();return;}
 if(m.type==="results"&&m.requestId===requestId){
   filteredIndices=m.indices;currentPage=1;
   resultCount.textContent=`${filteredIndices.length.toLocaleString()} matching record${filteredIndices.length===1?"":"s"}`;
   hint.textContent=`Searching ${columnSelect.value==="all"?"all columns":columnSelect.value}.`;
   render();
 }
};

function scheduleSearch(){clearTimeout(searchTimer);searchTimer=setTimeout(doSearch,100)}
function doSearch(){
 const term=searchInput.value.trim();
 if(term.length<3){requestId++;filteredIndices=[];currentPage=1;resultCount.textContent=`${data.length.toLocaleString()} records loaded`;hint.textContent="Enter 3 or more characters to search.";render();return;}
 const id=++requestId;worker.postMessage({type:"search",term,column:columnSelect.value,requestId:id});
}

function render(){
 results.innerHTML="";mobileResults.innerHTML="";
 if(filteredIndices.length===0){
   empty.style.display="block";empty.textContent=searchInput.value.trim().length>=3?"No matching records found.":"Enter a search term to see matching products.";
   pageInfo.textContent="Page 0 of 0";prevBtn.disabled=nextBtn.disabled=true;return;
 }
 empty.style.display="none";
 const totalPages=Math.ceil(filteredIndices.length/PAGE_SIZE);currentPage=Math.min(currentPage,totalPages);
 const start=(currentPage-1)*PAGE_SIZE,end=Math.min(start+PAGE_SIZE,filteredIndices.length);
 const frag=document.createDocumentFragment(),mobileFrag=document.createDocumentFragment();

 for(let p=start;p<end;p++){
   const r=data[filteredIndices[p]];
   const tr=document.createElement("tr");
   for(const c of columns){const td=document.createElement("td");td.textContent=r[c]??"";tr.appendChild(td)}
   frag.appendChild(tr);

   const card=document.createElement("article");card.className="mobile-card";
   const code=document.createElement("div");code.className="mobile-code";code.textContent=r["Item Code"]??"";
   const desc=document.createElement("div");desc.className="mobile-description";desc.textContent=r["Item Description"]??"";
   const meta=document.createElement("div");meta.className="mobile-meta";
   addMeta(meta,"Division",r["Divison"]); addMeta(meta,"Category",r["Category"]);
   const prices=document.createElement("div");prices.className="price-grid";
   addPrice(prices,"SDP",r["SDP"]);addPrice(prices,"NRP",r["NRP"]);addPrice(prices,"MRP",r["MRP"]);
   const discount=document.createElement("div");discount.className="discount-box";
   const dl=document.createElement("span");dl.textContent="Discount";
   const dv=document.createElement("strong");dv.textContent=`${r["Discount"]??""}%`;
   discount.append(dl,dv);card.append(code,desc,meta,prices,discount);mobileFrag.appendChild(card);
 }
 results.appendChild(frag);mobileResults.appendChild(mobileFrag);
 pageInfo.textContent=`Page ${currentPage.toLocaleString()} of ${totalPages.toLocaleString()}`;
 prevBtn.disabled=currentPage===1;nextBtn.disabled=currentPage===totalPages;
}

function addMeta(parent,label,value){
 const row=document.createElement("div");row.className="meta-row";
 const l=document.createElement("span");l.className="meta-label";l.textContent=label;
 const v=document.createElement("span");v.className="meta-value";v.textContent=value??"";
 row.append(l,v);parent.appendChild(row);
}
function addPrice(parent,label,value){
 const box=document.createElement("div");box.className="price-box";
 const l=document.createElement("div");l.className="price-label";l.textContent=label;
 const v=document.createElement("div");v.className="price-value";v.textContent=value??"";
 box.append(l,v);parent.appendChild(box);
}
searchInput.addEventListener("input",scheduleSearch);columnSelect.addEventListener("change",scheduleSearch);
clearBtn.addEventListener("click",()=>{clearTimeout(searchTimer);searchInput.value="";columnSelect.value="all";requestId++;filteredIndices=[];currentPage=1;resultCount.textContent=`${data.length.toLocaleString()} records loaded`;hint.textContent="Enter 3 or more characters to search.";render();searchInput.focus()});
prevBtn.addEventListener("click",()=>{if(currentPage>1){currentPage--;render();window.scrollTo({top:0,behavior:"smooth"})}});
nextBtn.addEventListener("click",()=>{const totalPages=Math.ceil(filteredIndices.length/PAGE_SIZE);if(currentPage<totalPages){currentPage++;render();window.scrollTo({top:0,behavior:"smooth"})}});
