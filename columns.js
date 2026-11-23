// Preserve readable, verified article links when the optional feed is unavailable.
function parseColumnCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted && text[i+1]==='"'){field+='"';i++;} else quoted=!quoted; }
    else if(c===',' && !quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(field);rows.push(row);row=[];field='';}
    else field+=c;
  }
  if(field||row.length){row.push(field);rows.push(row);} return rows;
}
(async function loadUpdates(){
  const grid=document.getElementById('mediaGrid');
  let items=Array.from(grid.querySelectorAll('a.media-card')).map(a=>({title:a.querySelector('.media-card-title').textContent,url:a.href,date:a.querySelector('time').dateTime,kind:a.dataset.kind}));
  const valid=a=>{try{return a.title && new URL(a.url).protocol==='https:' && Number.isFinite(Date.parse(a.date));}catch{return false;}};
  const results=await Promise.allSettled([
    (async()=>{
      const res=await fetch('https://sr.aymsr-ai.com/news/',{signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error('News unavailable');
      const doc=new DOMParser().parseFromString(await res.text(),'text/html');
      return Array.from(doc.querySelectorAll('.news-list li')).map(li=>({title:li.querySelector('h2 a')?.textContent,url:new URL(li.querySelector('h2 a')?.getAttribute('href'),'https://sr.aymsr-ai.com').href,date:li.querySelector('time')?.dateTime,kind:'news'})).filter(valid);
    })(),
    (async()=>{
      const res=await fetch('https://docs.google.com/spreadsheets/d/17DOiCDeFi_RQFJajGkcud0Hn-3xeoDNB2cJJ0dN1u_o/export?format=csv&gid=0',{signal:AbortSignal.timeout(8000)});if(!res.ok)throw Error('Columns unavailable');
      return parseColumnCsv(await res.text()).slice(1).map(([title,url,date])=>({title:title?.trim(),url:url?.trim(),date:date?.trim(),kind:'column'})).filter(valid);
    })()
  ]);
  results.forEach((result,i)=>{if(result.status==='fulfilled'&&result.value.length){const kind=i===0?'news':'column';items=items.filter(a=>a.kind!==kind).concat(result.value);}});
  items.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date));
  const seen=new Set();items=items.filter(a=>{if(seen.has(a.url))return false;seen.add(a.url);return true;});
  const fragment=document.createDocumentFragment();
  for(const a of items.slice(0,6)){
    const link=document.createElement('a');link.href=a.url;link.className='media-card visible';link.dataset.kind=a.kind;
    if(a.kind==='column'){link.target='_blank';link.rel='noopener';}
    const source=document.createElement('div');source.className='media-card-source';source.textContent=a.kind==='news'?'お知らせ':'コラム';
    const title=document.createElement('div');title.className='media-card-title';title.textContent=a.title;
    const date=document.createElement('time');date.className='media-card-date';date.dateTime=a.date;date.textContent=a.date;
    const note=document.createElement('span');note.className='column-external';note.textContent=a.kind==='news'?'記事を読む':'掲載先で読む（別タブ）';
    link.append(source,title,date,note);fragment.append(link);
  }
  grid.replaceChildren(fragment);
})();
