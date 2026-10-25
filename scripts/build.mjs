import { readFile, readdir, mkdir, writeFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import { parse } from 'yaml';
export const root = fileURLToPath(new URL('../', import.meta.url));
const origin = 'https://sr.aymsr-ai.com';
const md = new MarkdownIt({ html: false, linkify: true });
const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jp = d => Number(d.slice(0,4))+'年'+Number(d.slice(5,7))+'月'+Number(d.slice(8,10))+'日';
md.renderer.rules.table_open = () => '<div class="table-scroll" role="region" aria-label="記事の表（横にスクロールできます）" tabindex="0"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';
export function parseArticle(source, filename) {
  const match = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(filename+': frontmatter が必要です');
  const data = parse(match[1], { uniqueKeys: true });
  for (const key of ['title','date','slug','summary','updated']) {
    if (typeof data?.[key] !== 'string' || !data[key].trim()) throw new Error(filename+': '+key+' が必要です（文字列）');
  }
  for (const key of ['date','updated']) {
    const v=data[key];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0,10)!==v) throw new Error(filename+': '+key+' の日付が不正です');
  }
  if(data.updated<data.date) throw new Error(filename+': updated は date 以降にしてください');
  if(!new RegExp('^'+data.date+'-[a-z0-9]+(?:-[a-z0-9]+)*$').test(data.slug)) throw new Error(filename+': slug は YYYY-MM-DD-英数字スラッグ です');
  if(data.draft!==undefined && typeof data.draft!=='boolean') throw new Error(filename+': draft は true / false です');
  if(data.description!==undefined && typeof data.description!=='string') throw new Error(filename+': description は文字列です');
  if(/^# /m.test(match[2])) throw new Error(filename+': h1 は title から生成します。本文は ## から始めてください');
  return {...data,body:match[2],url:'/news/'+data.slug+'/'};
}
export async function build({preview=false,today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'})}={}) {
  // Only fixed generated directories are replaced; sources are never deleted.
  const out=path.join(root,preview?'work/preview':'dist');
  const articles=[],slugs=new Set();
  for(const f of (await readdir(path.join(root,'news'))).filter(f=>f.endsWith('.md')).sort()) {
    const a=parseArticle(await readFile(path.join(root,'news',f),'utf8'),f);
    if(slugs.has(a.slug)) throw new Error('slug が重複しています: '+a.slug);
    slugs.add(a.slug);
    if(preview||(!a.draft&&a.date<=today)) articles.push(a);
  }
  articles.sort((a,b)=>b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug));
  const css=await readFile(path.join(root,'templates/news.css'),'utf8');
  const nav=await readFile(path.join(root,'templates/navigation.html'),'utf8');
  function page(title,description,url,content,a) {
    const data=a?JSON.stringify({'@context':'https://schema.org','@type':'Article',headline:a.title,description,datePublished:a.date,dateModified:a.updated,url:origin+url,mainEntityOfPage:origin+url,inLanguage:'ja',author:{'@type':'Organization',name:'あゆ実社労士事務所',url:origin+'/'},publisher:{'@type':'Organization',name:'あゆ実社労士事務所',url:origin+'/'}}).replace(/</g,'\\u003c'):null;
    return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}｜あゆ実社労士事務所</title><meta name="description" content="${esc(description)}">
<link rel="canonical" href="${origin+url}"><meta property="og:title" content="${esc(title)}｜あゆ実社労士事務所"><meta property="og:description" content="${esc(description)}"><meta property="og:type" content="${a?'article':'website'}"><meta property="og:url" content="${origin+url}"><meta property="og:locale" content="ja_JP"><meta property="og:site_name" content="あゆ実社労士事務所">
${preview?'<meta name="robots" content="noindex,nofollow">':''}${data?'<script type="application/ld+json">'+data+'</script>':''}
<style>${css}</style></head><body><a class="skip" href="#main">本文へ</a>${nav}
${preview?'<p class="preview">ローカル確認用プレビュー（下書きを含みます）</p>':''}
<main id="main" class="news-page">${content}</main><footer>あゆ実社労士事務所</footer></body></html>`;
  }
  await rm(out,{recursive:true,force:true});
  await mkdir(path.join(out,'news'),{recursive:true});
  // Allowlist excludes drafts, tooling and documentation from public output.
  for(const f of ['index.html','pricing.html','profile.jpg','speaker.png','robots.txt']) await cp(path.join(root,f),path.join(out,f));
  for(const a of articles) {
    const content=`<a class="back" href="/news/">← お知らせ一覧</a><article><header class="article-header"><p class="eyebrow">NEWS</p><h1>${esc(a.title)}</h1><p class="meta">公開日：<time datetime="${a.date}">${jp(a.date)}</time>${a.updated!==a.date?' ／ 更新日：<time datetime="'+a.updated+'">'+jp(a.updated)+'</time>':''}</p><p class="reference-date">${jp(a.updated)}時点の情報です</p></header>
<div class="prose">${md.render(a.body)}</div><aside class="disclaimer"><h2>免責</h2><p>本記事は、${jp(a.updated)}時点で公表されている法令・指針に基づく<strong>一般的な情報提供</strong>です。個別の事案については、事実関係によって判断が変わります。実際のご対応にあたっては、顧問先の皆さまは個別にご相談ください。</p><p>また、税務に関する事項は税理士の先生にご確認ください。</p></aside></article>
<section class="consult"><h2>労務のお悩み、ご相談ください</h2><p>初回30分の無料相談を受け付けています。</p><a class="button" href="/#contact">無料相談を予約する</a></section><a class="back" href="/news/">← お知らせ一覧へ戻る</a>`;
    const target=path.join(out,'news',a.slug);await mkdir(target,{recursive:true});
    await writeFile(path.join(target,'index.html'),page(a.title,a.description||a.summary,a.url,content,a));
  }
  const content=`<header class="article-header"><p class="eyebrow">NEWS</p><h1>お知らせ</h1><p class="intro">労務管理や制度の動きなど、事業主の皆さまに役立つ情報をお届けします。</p></header>${articles.length?'<ul class="news-list">'+articles.map(a=>'<li><time datetime="'+a.date+'">'+jp(a.date)+'</time><div><h2><a href="'+a.url+'">'+esc(a.title)+'</a></h2><p>'+esc(a.summary)+'</p></div></li>').join('')+'</ul>':'<p class="empty">お知らせは準備中です。</p>'}<a class="back" href="/">← トップページへ</a>`;
  await writeFile(path.join(out,'news/index.html'),page('お知らせ','あゆ実社労士事務所から、労務管理や制度の動きに関するお知らせをお届けします。','/news/',content));
  const base=(await readFile(path.join(root,'sitemap.xml'),'utf8')).replace(/\s*<url>\s*<loc>https:\/\/sr\.aymsr-ai\.com\/news\/[\s\S]*?<\/url>/g,'');
  const entries=[{url:'/news/'},...articles].map(a=>'<url><loc>'+origin+a.url+'</loc>'+(a.updated?'<lastmod>'+a.updated+'</lastmod>':'')+'</url>').join('\n');
  await writeFile(path.join(out,'sitemap.xml'),base.replace('</urlset>',entries+'\n</urlset>'));
  if(preview) await writeFile(path.join(out,'robots.txt'),'User-agent: *\nDisallow: /\n');
  return {out,count:articles.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const r=await build({preview:process.argv.includes('--preview')});console.log(r.count+' article(s) → '+r.out);
}

