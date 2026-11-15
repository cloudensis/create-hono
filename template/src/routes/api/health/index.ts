import { defineHandler } from "hono/factory";

const GET = defineHandler((c) => c.json({ status: "ok" }));

export { GET };
