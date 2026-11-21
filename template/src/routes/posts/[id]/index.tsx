import type { Handler } from "hono";
import { excerpt } from "../../../site";
import { posts } from "../../data";

const ssg = true;

const ssgParams = () => posts.map((post) => ({ id: post.id }));

const GET: Handler = (c) => {
	const post = posts.find((post) => post.id === c.req.param("id"));
	if (!post) return c.notFound();

	return c.render(
		<>
			<nav>
				{post.category.map((name, i) => (
					<>
						{" / "}
						<a href={`/categories/${post.category.slice(0, i + 1).join("/")}`}>
							{name}
						</a>
					</>
				))}
			</nav>
			<h1>{post.title}</h1>
			<p>{post.body}</p>
		</>,
		{ title: post.title, description: excerpt(post.body), type: "article" },
	);
};

export { GET, ssg, ssgParams };
