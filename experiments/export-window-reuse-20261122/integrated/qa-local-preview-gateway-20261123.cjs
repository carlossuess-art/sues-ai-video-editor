"use strict";
const http=require("http");
http.createServer((req,res)=>{
 const prefix="/q03-export-qa",url=req.url||"";
 if(!url.startsWith(prefix+"/")){res.writeHead(404);res.end();return}
 const target=url.slice(prefix.length);
 const h={...req.headers,host:"127.0.0.1:18156"};
 const x=http.request({hostname:"127.0.0.1",port:18156,path:target,method:req.method,headers:h},r=>{
  const heads={...r.headers};delete heads["content-security-policy"];
  res.writeHead(r.statusCode,heads);r.pipe(res)
 });x.on("error",e=>{res.writeHead(502);res.end(String(e))});req.pipe(x);
}).listen(18171,"127.0.0.1",()=>console.log("QA_LOCAL_GATEWAY_ACTIVE"));
