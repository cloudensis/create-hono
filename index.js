#!/usr/bin/env node
// npm create @cloudensis/hono [project-name]
import fs from "node:fs/promises";
import path from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
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

let target = process.argv[2];
if (!target) {
	const rl = createInterface({ input: stdin, output: stdout });
	target =
		(await rl.question(`Project name: (${TEMPLATE_NAME}) `)) || TEMPLATE_NAME;
	rl.close();
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
const rootExisted = await fs
	.access(root)
	.then(() => true)
	.catch(() => false);

// ローカルの template/ で動かしたときの生成物はコピーしない
const IGNORED = new Set([
	"node_modules",
	"package-lock.json",
	".cloudflare",
	".wrangler",
]);

/** テンプレート内の文字列を書き換える。見つからなければテンプレートの変更に追従できていないためエラーにする */
const replaceInFile = async (file, from, to) => {
	const filePath = path.join(root, file);
	const content = await fs.readFile(filePath, "utf8");
	if (!content.includes(from)) {
		throw new Error(`${file} に ${JSON.stringify(from)} が見つかりません`);
	}
	await fs.writeFile(filePath, content.replace(from, to));
};

const generate = async () => {
	await fs.cp(TEMPLATE_DIR, root, {
		recursive: true,
		filter: (src) =>
			!IGNORED.has(path.relative(TEMPLATE_DIR, src).split(path.sep)[0]),
	});
	// npm は .gitignore を公開しないため、_gitignore として同梱している
	await fs.rename(path.join(root, "_gitignore"), path.join(root, ".gitignore"));

	const pkgPath = path.join(root, "package.json");
	const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
	pkg.name = name;
	await fs.writeFile(pkgPath, `${JSON.stringify(pkg, null, "\t")}\n`);
	await replaceInFile(
		"cloudflare.config.ts",
		`name: "${TEMPLATE_NAME}"`,
		`name: "${name}"`,
	);
	await replaceInFile("README.md", `# ${TEMPLATE_NAME}\n`, `# ${name}\n`);
};

try {
	await generate();
} catch (error) {
	// 生成前は空（または存在しない）ことを確認しているため、中身はすべて CLI が作ったもの
	if (rootExisted) {
		for (const entry of await fs.readdir(root)) {
			await fs.rm(path.join(root, entry), { recursive: true, force: true });
		}
	} else {
		await fs.rm(root, { recursive: true, force: true });
	}
	console.error(`Failed to create the project: ${error.message}`);
	process.exit(1);
}

const relative = path.relative(process.cwd(), root) || ".";
const cdPath = /\s/.test(relative) ? JSON.stringify(relative) : relative;
console.log(`
Created ${name} in ${root}

Next steps:
${relative === "." ? "" : `  cd ${cdPath}\n`}  npm install
  npm run dev
`);
