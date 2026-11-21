# hono-app

## コマンド

| コマンド            | 内容               |
| ------------------- | ------------------ |
| `npm run dev`       | 開発サーバーを起動 |
| `npm run build`     | ビルドと SSG       |
| `npm test`          | テスト             |
| `npm run lint`      | lint               |
| `npm run format`    | 整形               |
| `npm run typecheck` | 型チェック         |

## ルーティング

`src/routes` 以下の `index.ts` / `index.tsx` がルートになります。

| ファイル                                | パス                               |
| --------------------------------------- | ---------------------------------- |
| `routes/index.tsx`                      | `/`                                |
| `routes/posts/[id]/index.tsx`           | `/posts/:id`                       |
| `routes/categories/[...path]/index.tsx` | `/categories/a`, `/categories/a/b` |

- HTTP メソッド名（`GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `OPTIONS`）でハンドラーを export します。
- 固定 → パラメータ → catch-all の順に優先されます。
- 同じ URL にマッチするルートがあると起動時にエラーになります。

```tsx
import type { Handler } from "hono";

export const GET: Handler = (c) =>
	c.render(<h1>Hello</h1>, { title: "Hello", description: "説明" });
```

## SSG

`ssg = true` を export すると、`npm run build` で GET を静的 HTML に書き出します。動的ルートでは `ssgParams` も必要です。

```tsx
export const ssg = true;
export const ssgParams = () => [{ id: "1" }, { id: "2" }];
```

SSG は Node で実行するため、`cloudflare:workers` や binding は使えません。

## デプロイ

GitHub で Release を公開すると `.github/workflows/deploy.yaml` がデプロイします。

1. リポジトリの Settings > Environments で `production` を作成する（初回のデプロイ時にも自動で作られます）
2. `production` の Environment secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を設定する（Environment に限定すると、ほかの workflow からは使えません）
3. 必要に応じて Required reviewers を設定し、デプロイ前に承認が必要になるようにする

## 本番運用

- **ログ**: `cloudflare.config.ts` で Workers Logs（`observability`）を有効にしています。`console.log` / `console.error` の出力をダッシュボードで検索できます
- **SEO**: `src/site.ts` の `SITE_URL` に本番のオリジンを設定すると、canonical と `og:url` を出力します。`public/robots.txt` も用意しています
- **compatibilityDate**: `cloudflare.config.ts` の日付は、依存パッケージ（workerd）と合わせてテンプレートで動作を確認した日付です。上げるときは [互換性フラグの変更点](https://developers.cloudflare.com/workers/configuration/compatibility-flags/) を確認し、`npm run build` とテストで動作を確かめてください
