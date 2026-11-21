import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { trimTrailingSlash } from "hono/trailing-slash";
import { type RouteModule, registerRoutes } from "./lib/router";
import { renderer } from "./renderer";

const app = new Hono();

app.use(trimTrailingSlash({ alwaysRedirect: true }));
app.use(renderer);

registerRoutes(
	app,
	import.meta.glob<RouteModule>("./routes/**/index.{ts,tsx}", { eager: true }),
);

/** API のエラーはページではなく JSON で返す */
const isApi = (path: string) => path === "/api" || path.startsWith("/api/");

app.notFound((c) => {
	if (isApi(c.req.path)) return c.json({ error: "Not Found" }, 404);
	c.status(404);
	return c.render(<h1>404 Not Found</h1>, {
		title: "404 Not Found",
		description: "ページが見つかりません",
	});
});

app.onError((err, c) => {
	// ハンドラーが投げた HTTPException はそのステータスで返す
	if (err instanceof HTTPException && err.status < 500) {
		if (isApi(c.req.path)) {
			return c.json({ error: err.message }, err.status);
		}
		return err.getResponse();
	}
	console.error(err);
	if (isApi(c.req.path)) {
		return c.json({ error: "Internal Server Error" }, 500);
	}
	c.status(500);
	return c.render(<h1>500 Internal Server Error</h1>, {
		title: "500 Internal Server Error",
		description: "サーバーエラーが発生しました",
	});
});

export default app;
