import type { Env, Handler, Hono, MiddlewareHandler } from "hono";
import { disableSSG, ssgParams } from "hono/ssg";
import {
	compareRoutes,
	conflictKey,
	type ParsedRoute,
	parseRoute,
} from "./route";

const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"] as const;

type SSGParams = Record<string, string>[];

/** ルートファイルの export */
export type RouteModule = Partial<Record<(typeof methods)[number], Handler>> & {
	/** true にすると GET をビルド時に静的 HTML として書き出す */
	ssg?: boolean;
	/** 動的ルートで書き出すパラメータの一覧（async 可） */
	ssgParams?: () => SSGParams | Promise<SSGParams>;
};

type Route = ParsedRoute & { file: string; module: RouteModule };

const assertNoConflicts = (routes: Route[]): void => {
	const seen = new Map<string, string>();
	for (const route of routes) {
		const key = conflictKey(route.segments);
		const other = seen.get(key);
		if (other) {
			throw new Error(`ルートが衝突しています: ${other} と ${route.file}`);
		}
		seen.set(key, route.file);
	}
};

/** ルートファイルの export が規約どおりか確かめる */
const assertValidModule = ({ file, module }: Route): void => {
	for (const key of Object.keys(module)) {
		const method = key.toUpperCase();
		if (key !== method && (methods as readonly string[]).includes(method)) {
			throw new Error(
				`${file}: "${key}" は登録されません。ハンドラーは "${method}" で export してください`,
			);
		}
	}
	if (!methods.some((method) => module[method])) {
		throw new Error(
			`${file}: ハンドラー（${methods.join(", ")}）を export していません。routes 以下の index.{ts,tsx} はルートとして扱われます`,
		);
	}
	if (module.ssg && !module.GET) {
		throw new Error(`${file}: ssg を使うには GET を export してください`);
	}
};

const ssgMiddleware = ({
	file,
	module,
	segments,
}: Route): MiddlewareHandler => {
	if (!module.ssg) return disableSSG();
	if (module.ssgParams) return ssgParams(module.ssgParams);
	if (segments.some((segment) => segment.kind !== "static")) {
		throw new Error(
			`${file}: 動的ルートで ssg を使うには ssgParams が必要です`,
		);
	}
	return (_, next) => next();
};

export function registerRoutes<E extends Env>(
	app: Hono<E>,
	modules: Record<string, RouteModule>,
): void {
	const routes: Route[] = Object.entries(modules).map(([file, module]) => ({
		file,
		module,
		...parseRoute(file.slice("./routes/".length)),
	}));
	routes.forEach(assertValidModule);
	assertNoConflicts(routes);
	routes.sort(compareRoutes);

	for (const route of routes) {
		const ssg = ssgMiddleware(route);
		for (const method of methods) {
			const handler = route.module[method];
			if (!handler) continue;
			if (method === "GET") app.on(method, route.path, ssg, handler);
			else app.on(method, route.path, handler);
		}
	}
}
