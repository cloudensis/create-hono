// サンプルの記事データ。index.{ts,tsx} 以外のファイルはルートとして登録されない
export type Post = {
	id: string;
	title: string;
	body: string;
	/** 階層カテゴリ（例: ["tech", "web"] → /categories/tech/web） */
	category: string[];
};

export const posts: Post[] = [
	{
		id: "1",
		title: "Hono を始める",
		body: "Hono は Web 標準の API で動く軽量なフレームワークです。",
		category: ["tech", "web"],
	},
	{
		id: "2",
		title: "Cloudflare Workers にデプロイする",
		body: "cf deploy で Worker と静的アセットをまとめてデプロイできます。",
		category: ["tech", "cloud"],
	},
	{
		id: "3",
		title: "週末の散歩",
		body: "近所の公園を歩きました。",
		category: ["life"],
	},
];
