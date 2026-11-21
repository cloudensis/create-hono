# @cloudensis/create-hono

Create a Hono application for cloudensis.

## Quick Start

```sh
npm create @cloudensis/hono [project-name]
```

## Release

GitHub で Release を公開すると `.github/workflows/publish.yaml` が npm に公開します。

- タグは semver にします（例: `v1.2.3`）。`package.json` の `version` はタグから設定されます
- "Set as a pre-release" にした Release（例: `v1.3.0-rc.1`）は `next` タグで公開されます。`npm create @cloudensis/hono` の利用者には配布されず、`npm create @cloudensis/hono@next` で試せます
