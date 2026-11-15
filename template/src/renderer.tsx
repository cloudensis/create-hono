import { jsxRenderer } from "hono/jsx-renderer";
import { Link, ViteClient } from "vite-ssr-components/hono";

export type Meta = {
	title: string;
	description: string;
	noindex?: boolean;
};

type Render = (content: string | Promise<string>, meta: Meta) => Response;

declare module "hono" {
	interface ContextRenderer extends Render {}
}

export const renderer = jsxRenderer(
	({ children, title, description, noindex }) => {
		return (
			<html lang="ja">
				<head>
					<meta charset="utf-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<title>{title}</title>
					<meta name="description" content={description} />
					<meta property="og:title" content={title} />
					<meta property="og:description" content={description} />
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
