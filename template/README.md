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

GitHub で Release を公開すると `.github/workflows/deploy.yaml` がデプロイします。リポジトリの Secrets に `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` を設定してください。
