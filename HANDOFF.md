# お知らせ機能の引き継ぎ

> **このリポジトリはPublicです。pushした文章は誰でも読め、履歴にも残ります。下書きはGoogleドライブ側のVaultに置き、公開すると決まった完成稿だけをnews/に置いてpushしてください。**

## これは何か
既存の静的HTMLサイトにMarkdown記事の自動生成を追加したもの。
リポジトリ: https://github.com/KatoAyu/ayumi-srai
今回のクローン: C:/Users/kayum/Documents/Codex/2026-10-25/hp-news-section/site
元コミット: 236c9512a533b44342fc92bbfa694cdd30f42c10
公開中のトップ・料金ページと取得時のソースは改行差を除き一致。
ユーザー確認済み: GitHub main へのpushでNetlifyが自動公開。
Netlify設定は build=npm run build / publish=dist / Node.js=22 を netlify.toml で指定。

## ファイル構成と編集可否
- news/*.md: Claudeが記事を作成・事実確認。加藤さんの公開指示に従う。
- scripts/build.mjs: Codexが編集する生成処理。Markdown・YAMLの既存ライブラリを使用。
- templates/news.css、templates/navigation.html: Codexが編集する見た目・ナビ。
- index.html、pricing.html: 既存ページ。Codexが編集。今回ナビを追加。
- sitemap.xml: 既存ページのベース。記事エントリを手で追記しない。
- netlify.toml、package*.json、scripts/*.mjs: Codexが管理。
- dist/: 公開用生成物。編集・Git登録しない。Netlifyの公開先は必ずここ。
- work/preview/: ローカル確認専用の生成物。公開・Git登録しない。
- 元の「第1号原稿.md」は変更していない。news内のコピーはfrontmatterを正規化し、h1・免責をテンプレートへ移した。法令・条文・数値・出典は変更していない。

## 記事を1本追加する手順
1. 下書きはGoogleドライブ側のVaultで作成し、このリポジトリには置かない。
2. 公開すると決まった完成稿だけを `news/YYYY-MM-DD-slug.md` に置く（`draft: true` は使わない）。
3. 公開当日に `main` へコミット・pushする。Netlifyが記事・一覧・サイトマップを自動生成する。

**pushした時点で公開される前提です。`draft: true` は運用では使用しません。未来日付での予約公開もせず、公開当日にpushします。**

## frontmatter
```yaml
---
title: "記事タイトル"
date: "2026-10-25"
slug: "2026-10-25-customer-harassment"
summary: "一覧に載せる1行要約"
updated: "2026-10-25"
description: "検索結果向けの説明（省略時はsummary）"
---
本文を書きます。見出しは ## から始めます。
```
title/date/slug/summary/updated は必須。date/updated は引用符付きYYYY-MM-DD。
slugには日付を含め、dateと一致させる。半角英小文字・数字・ハイフンのみ。
updatedは法令情報の基準日兼最終更新日。未更新の記事はdateと同じ。
免責・基準日・h1は生成されるので本文に重ねて書かない。
出典リンクは本文にMarkdownで複数記載できる。表・箇条書き・引用にも対応。
生HTMLは実行せず文字として表示する。

## ハマりどころ
- 第1号は2026-10-25の追加指示で公開承認済み。draft指定を外した完成稿として公開する。
- リポジトリ自体は公開GitHub。draftはWebサイトへの出力を防ぐもので、GitHubにpushした原稿を秘匿する機能ではない。
- 未来のdateの記事は通常ビルドで除外。時刻は日本時間。日付になっても自動再ビルドはされないため予約公開には使わず、当日にpushする。
- 生成のたびにdist（プレビュー時はwork/preview）を作り直す。削除した記事が出力に残らない。
- ローカルプレビューはnoindexとrobots拒否付きだがアクセス制限ではない。work/previewをアップロードしない。
- Netlifyにサイトルートを手動アップロードしない。公開用はdistだけ。
- draft機能・build:previewはローカル検証用に残すが、下書きをリポジトリに保存する運用には使わない。
- 主な依存はmarkdown-itとyaml。package-lock.jsonでバージョンを固定。
- トップは既存のモバイルメニューに動作がなかったため開閉・Escape・キーボード操作を実装。料金ページは従来グローバルナビがなかったため追加。
- 本文の表はスマホで表だけ横スクロール。表領域はキーボードでも操作可能。
- 通常ビルドのsitemapは既存トップ・料金のエントリを保持し、一覧と公開記事を追加。

## 検証
npm test でメタデータの拒否、下書きと未来記事の除外、一覧順、SEO、削除記事の除去を確認。
npm run build / build:preview で公開承認済みの第1号が生成されることを確認する。
法令内容の再検証・修正はこの実装では行わない。


## 今回の反映（2026-10-25完了）
PR #1（https://github.com/KatoAyu/ayumi-srai/pull/1）をmainへマージ済み。実装コミット: 41ba4790ca8d806b31b78fa9c4eafb0b89ba617d。
本番の一覧・第1号・トップ・料金・サイトマップのHTTP 200とリンクを確認。記事のArticle構造化データとnoindexがないことも確認。
本番ブラウザで一覧から記事を開き、公開日・基準日・出典・免責・相談リンクを確認。幅390pxで2つの表のscrollLeftが各0→40に変わることを操作確認。ページ全体の横はみ出しなし。
テスト3件成功、通常ビルドで1記事生成。原稿本文・出典リンクは変更なし。
Gitの認証ヘルパーが起動できなかったため、接続済みGitHubツールでブランチに反映しPRをマージ。ローカルmainも同期済み。
