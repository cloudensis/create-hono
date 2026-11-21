/** パスの 1 セグメント（= routes 以下のディレクトリ 1 つ） */
export type Segment = {
	kind: "static" | "param" | "catchAll"; // articles | [id] | [...slug]
	name: string;
};

export type ParsedRoute = {
	segments: Segment[];
	path: string;
};

/** パラメータ名として使える名前（Hono の `:name` として解釈できるもの） */
const PARAM_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** Hono のパスで特別な意味を持つ文字（そのまま渡すとパラメータやワイルドカードになる） */
const RESERVED = /[:*?{}()[\]]/;

const toSegment = (dir: string): Segment => {
	const catchAll = dir.match(/^\[\.\.\.(.*)\]$/);
	const param = dir.match(/^\[(.*)\]$/);
	const match = catchAll ?? param;
	if (match) {
		if (!PARAM_NAME.test(match[1])) {
			throw new Error(
				`パラメータ名は英数字と _ で書いてください（先頭は数字以外）: ${dir}`,
			);
		}
		return { kind: catchAll ? "catchAll" : "param", name: match[1] };
	}
	if (RESERVED.test(dir)) {
		throw new Error(`ディレクトリ名に使えない文字が含まれています: ${dir}`);
	}
	return { kind: "static", name: dir };
};

const toHonoSegment = ({ kind, name }: Segment): string =>
	kind === "static" ? name : kind === "param" ? `:${name}` : `:${name}{.+}`;

/**
 * routes からの相対パスを Hono のパスに変換する。
 * - `index.tsx` → `/`
 * - `articles/[id]/index.tsx` → `/articles/:id`
 * - `docs/[...slug]/index.tsx` → `/docs/:slug{.+}`
 */
export const parseRoute = (file: string): ParsedRoute => {
	let segments: Segment[];
	try {
		segments = file.split("/").slice(0, -1).map(toSegment); // 末尾の index.tsx を除く
		// catch-all のあとにセグメントがあると、Hono では catch-all だけのルートに負けて到達できない
		if (segments.slice(0, -1).some((segment) => segment.kind === "catchAll")) {
			throw new Error(
				"catch-all（[...name]）は末尾のディレクトリにしか置けません",
			);
		}
	} catch (error) {
		throw new Error(`${file}: ${(error as Error).message}`);
	}
	return { segments, path: `/${segments.map(toHonoSegment).join("/")}` };
};

const RANK = { static: 0, param: 1, catchAll: 2 } as const;

/**
 * Hono は先に登録したルートを優先するため、左のセグメントから「固定 → パラメータ → catch-all」の順に並べる。
 * catch-all は末尾にしか置けないため、共通部分の種類がすべて同じルート同士は同じ URL にマッチしない
 */
export const compareRoutes = (a: ParsedRoute, b: ParsedRoute): number => {
	const length = Math.min(a.segments.length, b.segments.length);
	for (let i = 0; i < length; i++) {
		const diff = RANK[a.segments[i].kind] - RANK[b.segments[i].kind];
		if (diff !== 0) return diff;
	}
	return 0;
};

/** 同じ URL にマッチするルート（`[id]` と `[slug]` など）は同じキーになる */
export const conflictKey = (segments: Segment[]): string =>
	segments
		.map(({ kind, name }) =>
			kind === "static" ? name : kind === "param" ? ":" : "*",
		)
		.join("/");
