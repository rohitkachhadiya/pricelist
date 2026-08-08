let rows=[];let normalizedAll=[];let normalizedColumns={};
const columns=["Divison","Category","Item Code","Item Description","SDP","NRP","MRP","Discount 21.18%","Discount"];
const norm=v=>String(v??"").toLowerCase();
self.onmessage=e=>{
 const m=e.data;
 if(m.type==="load"){
   rows=m.data||[]; normalizedAll=new Array(rows.length);
   for(const c of columns) normalizedColumns[c]=new Array(rows.length);
   for(let i=0;i<rows.length;i++){
     const r=rows[i]; let all="";
     for(const c of columns){const v=norm(r[c]);normalizedColumns[c][i]=v;all+=v+"\\u0001";}
     normalizedAll[i]=all;
   }
   self.postMessage({type:"loaded",count:rows.length}); return;
 }
 if(m.type==="search"){
   const t=norm(m.term); if(t.length<3){self.postMessage({type:"results",indices:[],requestId:m.requestId});return;}
   const source=m.column==="all"?normalizedAll:normalizedColumns[m.column];
   const out=[]; for(let i=0;i<source.length;i++) if(source[i].includes(t)) out.push(i);
   self.postMessage({type:"results",indices:out,requestId:m.requestId});
 }
};