import { jsxRenderer, useRequestContext } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";
import { SITE_URL } from "./site";

export type Meta = {
	title: string;
	description: string;
	/** og:type。記事ページは "article" にする */
	type?: "website" | "article";
	noindex?: boolean;
};

type Render = (content: string | Promise<string>, meta: Meta) => Response;

declare module "hono" {
	interface ContextRenderer extends Render {}
}

export const renderer = jsxRenderer(
	({ children, title, description, type = "website", noindex }) => {
		const c = useRequestContext();
		const url = SITE_URL ? `${SITE_URL}${c.req.path}` : undefined;
		return (
			<html lang="ja">
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<title>{title}</title>
					<meta name="description" content={description} />
					{url && <link rel="canonical" href={url} />}
					<meta property="og:type" content={type} />
					<meta property="og:title" content={title} />
					<meta property="og:description" content={description} />
					{url && <meta property="og:url" content={url} />}
					{noindex && <meta name="robots" content="noindex, nofollow" />}
					<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
					<Link href="/src/style.css" rel="stylesheet" />
					<ViteClient />
				</head>
				<body>{children}</body>
			</html>
		);
	},
);
