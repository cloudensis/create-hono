import { defineConfig } from "cf/config";

export default defineConfig({
	worker: {
		name: "hono-app",
		compatibilityDate: "2026-10-30",
		entrypoint: "./src/index.tsx",
	},
});
