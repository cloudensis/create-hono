import type { Handler } from "hono";

const GET: Handler = (c) => c.json({ status: "ok" });

export { GET };
