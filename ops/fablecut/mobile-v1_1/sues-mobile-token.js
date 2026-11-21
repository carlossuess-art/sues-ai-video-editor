"use strict";
const fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const {DATA_DIR}=require("./paths");
const file=()=>path.join(DATA_DIR,".sues-mobile-mcp-ui-token");
function getToken(){
 const p=file();
 try{return fs.readFileSync(p,"utf8").trim();}
 catch(e){if(e.code!=="ENOENT")throw e;}
 const secret=crypto.randomBytes(32).toString("hex");
 try{fs.writeFileSync(p,secret,{flag:"wx",mode:0o600});return secret;}
 catch(e){if(e.code!=="EEXIST")throw e;return fs.readFileSync(p,"utf8").trim();}
}
module.exports={getToken};

