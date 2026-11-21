# @cloudensis/create-hono

Create a Hono application for cloudensis.

## Quick Start

```sh
npm create @cloudensis/hono [project-name]
```

## Dependabot

`.github/workflows/dependabot-auto-merge.yaml` は、Dependabot の PR のうち patch 更新と minor 更新（0.x とプレリリースを除く）を自動マージします。

`gh pr merge --auto` は、ブランチ保護の必須チェックが通るまでマージを待ちます。必須チェックが設定されていないと **CI を待たずに即座にマージされる** ため、`main` のブランチ保護（または Ruleset）で `test`（Test ワークフローのジョブ）を必須チェックにしてください。

GitHub Actions はコミット SHA で固定しています（Dependabot が SHA とコメントのバージョンを更新します）。
