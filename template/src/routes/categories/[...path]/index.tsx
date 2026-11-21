import type { Handler } from "hono";
import { posts } from "../../data";

// /categories/tech や /categories/tech/web にマッチし、そのカテゴリ以下の記事を表示する
const GET: Handler = (c) => {
	const path = c.req.param("path");
	const items = posts.filter((post) =>
		`${post.category.join("/")}/`.startsWith(`${path}/`),
	);
	if (items.length === 0) return c.notFound();

	return c.render(
		<>
			<h1>カテゴリ: {path}</h1>
			<ul>
				{items.map((post) => (
					<li>
						<a href={`/posts/${post.id}`}>{post.title}</a>
					</li>
				))}
			</ul>
		</>,
		{ title: `カテゴリ: ${path}`, description: `${path} の記事` },
	);
};

export { GET };
