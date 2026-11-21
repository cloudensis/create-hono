/**
 * 本番のオリジン（例: "https://example.com"）。末尾の / は不要。
 * 設定すると canonical と og:url を出力する
 */
export const SITE_URL = "";

/** meta description 向けに、長い文章を指定の文字数で切る */
export const excerpt = (text: string, length = 120): string =>
	text.length > length ? `${text.slice(0, length)}…` : text;
