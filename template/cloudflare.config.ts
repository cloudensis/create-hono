import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "hono-app",
		// 更新するときは変更点を確認する: https://developers.cloudflare.com/workers/configuration/compatibility-flags/
		compatibilityDate: "2026-10-30",
		entrypoint: "./src/index.tsx",
		// Workers Logs: console の出力やエラーをダッシュボードで検索できるようにする
		observability: {
			enabled: true,
		},
	},
});
