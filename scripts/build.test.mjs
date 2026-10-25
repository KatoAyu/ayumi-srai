import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,unlink,readdir} from 'node:fs/promises';
import path from 'node:path';
import {build,parseArticle,root} from './build.mjs';
const read=p=>readFile(path.join(root,p),'utf8');
const fixture=(title,date='2026-10-24',extra='')=>`---
title: "${title}"
date: "${date}"
updated: "${date}"
slug: "${date}-test"
summary: "要約"
${extra}---
本文 [出典](https://www.mhlw.go.jp/)
`;
test('invalid metadata fails instead of publishing malformed paths or dates',()=>{
  for(const text of [
    fixture('test').replace('2026-10-24-test','../escape'),
    fixture('test','2026-02-30'),
    fixture('test').replace('updated: "2026-10-24"','updated: "2026-10-01"'),
    fixture('test').replace('title: "test"','title: ""'),
    fixture('test',undefined,'draft: "false"\n'),
    fixture('test')+'\n# duplicate h1',
    fixture('test',undefined,'title: duplicate\n')
  ]) assert.throws(()=>parseArticle(text,'fixture'));
});
test('production, preview, article addition, sitemap and stale removal',async()=>{
  let result=await build({today:'2026-10-25'});
  assert.equal(result.count,1);
  assert.match(await read('dist/news/index.html'),/customer-harassment/);
  assert.match(await read('dist/sitemap.xml'),/customer-harassment/);
  assert.deepEqual((await readdir(path.join(root,'dist'))).sort(),['index.html','news','pricing.html','profile.jpg','robots.txt','sitemap.xml','speaker.png']);
  result=await build({preview:true});
  assert.equal(result.count,1);
  const html=await read('work/preview/news/2026-10-25-customer-harassment/index.html');
  assert.equal((html.match(/<h1>/g)||[]).length,1);
  assert.equal((html.match(/class="table-scroll"/g)||[]).length,2);
  assert.match(html,/2026年10月25日時点の情報です/);
  assert.match(html,/name="robots" content="noindex,nofollow"/);
  assert.match(html,/href="\/#contact"/);
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(schema['@type'],'Article');assert.equal(schema.datePublished,'2026-10-25');
  assert.equal(schema.dateModified,'2026-10-25');
  const files=['test-older.md','test-newer.md','test-future.md','test-draft.md'];
  try{
    await writeFile(path.join(root,'news',files[0]),fixture('古い記事'));
    await writeFile(path.join(root,'news',files[1]),fixture('<新しい記事>','2026-10-25'));
    await writeFile(path.join(root,'news',files[2]),fixture('未来記事','2099-01-01'));
    await writeFile(path.join(root,'news',files[3]),fixture('下書き','2026-10-23','draft: true\n'));
    result=await build({today:'2026-10-25'});assert.equal(result.count,3);
    const list=await read('dist/news/index.html');
    assert.ok(list.indexOf('&lt;新しい記事&gt;')<list.indexOf('古い記事'));
    assert.doesNotMatch(list,/未来記事|下書き/);
    const sitemap=await read('dist/sitemap.xml');
    assert.equal((sitemap.match(/<loc>/g)||[]).length,6);
    assert.match(sitemap,/<lastmod>2026-10-25<\/lastmod>/);
    assert.match(sitemap,/https:\/\/sr.aymsr-ai.com\/pricing<\/loc>/);
    assert.match(await read('dist/news/2026-10-25-test/index.html'),/og:type" content="article"/);
  }finally{
    for(const f of files)await unlink(path.join(root,'news',f)).catch(()=>{});
    await build({today:'2026-10-25'});
  }
  assert.deepEqual((await readdir(path.join(root,'dist/news'))).sort(),['2026-10-25-customer-harassment','index.html']);
});


test('navigation has a closed accessible mobile button on home and news links on both pages',async()=>{
 const home=await read('index.html');
 assert.match(home,/<button[^>]+id="hamburger"[^>]+aria-controls="navigationLinks">\s*<span><\/span><span><\/span><span><\/span>\s*<\/button>/);
 for(const file of ['index.html','pricing.html'])assert.match(await read(file),/href="\/news\/"/);
});
