import { Hono } from "hono";
import { secureHeaders } from "hono/secure-headers";
import { trimTrailingSlash } from "hono/trailing-slash";
import { type RouteModule, registerRoutes } from "./lib/router";
import { renderer } from "./renderer";

const app = new Hono();

// SSG したページ用の public/_headers にも同じヘッダーを設定している
app.use(secureHeaders());
app.use(trimTrailingSlash({ alwaysRedirect: true }));
app.use(renderer);

registerRoutes(
	app,
	import.meta.glob<RouteModule>("./routes/**/index.{ts,tsx}", { eager: true }),
);

app.notFound((c) => {
	c.status(404);
	return c.render(<h1>404 Not Found</h1>, {
		title: "404 Not Found",
		description: "ページが見つかりません",
	});
});

app.onError((err, c) => {
	console.error(err);
	c.status(500);
	return c.render(<h1>500 Internal Server Error</h1>, {
		title: "500 Internal Server Error",
		description: "サーバーエラーが発生しました",
	});
});

export default app;
