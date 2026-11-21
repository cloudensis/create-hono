# @cloudensis/create-hono

Create a Hono application for cloudensis.

## Quick Start

```sh
npm create @cloudensis/hono [project-name]
```

プロジェクト名を省略すると、対話形式で入力できます（空のまま Enter で `hono-app`）。

## Requirements

- Node.js（`package.json` の `engines` を参照）
- 生成したプロジェクトのデプロイには Cloudflare のアカウントが必要です

## 生成されるプロジェクト

- [Hono](https://hono.dev/) + [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- `src/routes` 以下のディレクトリ構成によるファイルベースルーティング
- `ssg = true` を export したページのビルド時の静的 HTML 書き出し（SSG）
- Biome（lint / format）、TypeScript、Vitest
- GitHub Actions（PR でのテスト、Release の公開時のデプロイ）

詳しくは [template/README.md](template/README.md) を参照してください。

## Development

```sh
# CLI のテスト
npm test

# ローカルの CLI でプロジェクトを生成する
node index.js ../my-app

# テンプレートをそのまま動かす（生成物は CLI でコピーされない）
cd template
npm install
npm run dev
```

- テンプレートを変更したら、CI と同じく生成したプロジェクトで `lint` / `typecheck` / `test` / `build` が通ることを確認してください
- テンプレートの依存パッケージは Dependabot が週 1 回更新します（`.github/dependabot.yml`）

## Release

GitHub で Release を公開すると `.github/workflows/publish.yaml` が npm に公開します。タグは semver（例: `v1.2.3`）にします。リリースノートは「Generate release notes」で自動生成できます（`.github/release.yml` で Dependabot の更新を別の見出しにまとめています）。

## License

[MIT](LICENSE)
