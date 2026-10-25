# あゆ実社労士事務所 HP
素のHTMLを維持し、Node.jsでお知らせだけを生成します。

> **このリポジトリはPublicです。pushした文章は誰でも読めます。履歴にも残るため、公開すると決まった完成稿だけを置いてください。**

## 記事を1本追加する手順
1. 下書きはGoogleドライブ側のVaultで作成し、このリポジトリには置かない。
2. 公開すると決まった完成稿だけを `news/YYYY-MM-DD-slug.md` に置く（`draft: true` は使わない）。
3. 公開当日に `main` へコミット・pushする。Netlifyが記事・一覧・サイトマップを自動生成する。

未来日付での予約公開はしません。pushした時点で公開される前提で扱います。
書式・注意点は [HANDOFF.md](HANDOFF.md) を参照。
ローカル検証：Node.js 22以上で `npm ci` → `npm test` → `npm run build`。
`npm run build:preview` と `work/preview/` はローカル確認用として維持します。`draft: true` の機能は残しますが、運用では使用しません。
このPCではlocalhostに到達できないため、表示確認は本番URLで行います。
