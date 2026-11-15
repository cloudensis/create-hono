import { defineHandler } from "hono/factory";
import { posts } from "./data";

const ssg = true;

const GET = defineHandler((c) =>
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
	),
);

export { GET, ssg };
