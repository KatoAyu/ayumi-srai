import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {root} from './build.mjs';
const base=path.join(root,process.argv.includes('--production')?'dist':'work/preview');
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost');
    let file=path.resolve(base,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(base+path.sep)&&file!==base) throw Error('path');
    try{if((await stat(file)).isDirectory())file=path.join(file,'index.html');}catch{if(!path.extname(file))file+='.html';}
    const data=await readFile(file);
    const types={'.html':'text/html; charset=utf-8','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.xml':'application/xml','.txt':'text/plain'};
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4173/news/'));

