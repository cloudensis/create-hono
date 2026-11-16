import type { Handler } from "hono";
import { posts } from "./data";

const ssg = true;

const GET: Handler = (c) =>
	c.render(
		<>
			<h1>Blog</h1>
			<ul>
				{posts.map((post) => (
					<li>
						<a href={`/posts/${post.id}`}>{post.title}</a>
					</li>
				))}
			</ul>
		</>,
		{ title: "Blog", description: "記事の一覧" },
	);

export { GET, ssg };
