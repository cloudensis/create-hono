#!/usr/bin/env node
// npm create @cloudensis/hono [project-name]
import fs from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

const TEMPLATE_DIR = fileURLToPath(new URL("./template/", import.meta.url));
const TEMPLATE_NAME = "hono-app";

/** npm のパッケージ名・Worker 名として使える形に整える */
const toPackageName = (name) =>
	name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, "-")
		.replace(/^-+|-+$/g, "");

const isEmptyDir = async (dir) => {
	try {
		return (await fs.readdir(dir)).length === 0;
	} catch (error) {
		if (error.code === "ENOENT") return true;
		if (error.code === "ENOTDIR") return false;
		throw error;
	}
};

/** 1 行だけ入力を受け取る。入力が EOF で終わったときは空文字を返す */
const ask = (question) =>
	new Promise((resolve) => {
		const rl = createInterface({ input: stdin, output: stdout });
		let answered = false;
		// question() は改行なしで EOF になった最後の行を受け取れないため、
		// line イベントで受け取る（line は close より先に同期的に発火する）
		rl.once("line", (answer) => {
			answered = true;
			rl.close();
			resolve(answer);
		});
		rl.on("close", () => {
			if (answered) return;
			stdout.write("\n");
			resolve("");
		});
		rl.setPrompt(question);
		rl.prompt();
	});

let target = process.argv[2];
if (!target) {
	target =
		(await ask(`Project name: (${TEMPLATE_NAME}) `)).trim() || TEMPLATE_NAME;
}

const root = path.resolve(target);
const name = toPackageName(path.basename(root));
if (!name) {
	console.error(`Invalid project name: ${target}`);
	process.exit(1);
}
if (!(await isEmptyDir(root))) {
	console.error(`Directory is not empty or is a file: ${root}`);
	process.exit(1);
}

// ローカルの template/ で動かしたときの生成物はコピーしない
const IGNORED = new Set([
	"node_modules",
	"package-lock.json",
	".cloudflare",
	".wrangler",
]);
await fs.cp(TEMPLATE_DIR, root, {
	recursive: true,
	filter: (src) =>
		!IGNORED.has(path.relative(TEMPLATE_DIR, src).split(path.sep)[0]),
});
// npm は .gitignore を公開しないため、_gitignore として同梱している
await fs.rename(path.join(root, "_gitignore"), path.join(root, ".gitignore"));

const replacements = {
	"package.json": [`"${TEMPLATE_NAME}"`, `"${name}"`],
	"cloudflare.config.ts": [`"${TEMPLATE_NAME}"`, `"${name}"`],
	"README.md": [`# ${TEMPLATE_NAME}\n`, `# ${name}\n`],
};
for (const [file, [from, to]] of Object.entries(replacements)) {
	const filePath = path.join(root, file);
	const content = await fs.readFile(filePath, "utf8");
	await fs.writeFile(filePath, content.replace(from, to));
}

const relative = path.relative(process.cwd(), root) || ".";
const cdPath = /\s/.test(relative) ? JSON.stringify(relative) : relative;
console.log(`
Created ${name} in ${root}

Next steps:
${relative === "." ? "" : `  cd ${cdPath}\n`}  npm install
  npm run dev
`);
