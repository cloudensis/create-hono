import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const CLI = fileURLToPath(new URL("../index.js", import.meta.url));

const run = (cwd, args, input) =>
	spawnSync(process.execPath, [CLI, ...args], {
		cwd,
		input,
		encoding: "utf8",
	});

let tmp;
before(async () => {
	tmp = await fs.mkdtemp(path.join(os.tmpdir(), "create-hono-"));
});
after(async () => {
	await fs.rm(tmp, { recursive: true, force: true });
});

describe("プロジェクトの生成", () => {
	let root;
	let result;
	before(() => {
		result = run(tmp, ["My App"]);
		root = path.join(tmp, "My App");
	});

	it("終了コード 0 で終わり、次の手順を表示する", () => {
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /Created my-app/);
		assert.match(result.stdout, /cd "My App"/);
	});

	it("名前を npm / Worker で使える形に整えて書き換える", async () => {
		const read = (file) => fs.readFile(path.join(root, file), "utf8");
		assert.equal(JSON.parse(await read("package.json")).name, "my-app");
		assert.match(await read("cloudflare.config.ts"), /name: "my-app"/);
		assert.match(await read("README.md"), /^# my-app\n/);
	});

	it("_gitignore を .gitignore にリネームする", () => {
		assert.ok(existsSync(path.join(root, ".gitignore")));
		assert.ok(!existsSync(path.join(root, "_gitignore")));
	});

	it("動作確認の生成物はコピーしない", () => {
		for (const name of [
			"node_modules",
			"package-lock.json",
			".cloudflare",
			".wrangler",
		]) {
			assert.ok(!existsSync(path.join(root, name)), name);
		}
	});
});

describe("引数なしで実行したとき", () => {
	it("入力したプロジェクト名で生成する", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "prompt-"));
		const result = run(cwd, [], "prompted\n");
		assert.equal(result.status, 0, result.stderr);
		assert.ok(existsSync(path.join(cwd, "prompted/package.json")));
	});

	it("空入力なら hono-app で生成する", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "default-"));
		const result = run(cwd, [], "\n");
		assert.equal(result.status, 0, result.stderr);
		assert.ok(existsSync(path.join(cwd, "hono-app/package.json")));
	});
});

describe("エラー", () => {
	it("空でないディレクトリには生成しない", async () => {
		await fs.mkdir(path.join(tmp, "not-empty"));
		await fs.writeFile(path.join(tmp, "not-empty/keep.txt"), "");
		const result = run(tmp, ["not-empty"]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /not empty/);
		assert.deepEqual(await fs.readdir(path.join(tmp, "not-empty")), [
			"keep.txt",
		]);
	});

	it("ファイルを指定するとクラッシュせずにエラーを表示する", async () => {
		await fs.writeFile(path.join(tmp, "a-file"), "");
		const result = run(tmp, ["a-file"]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /is a file/);
		assert.doesNotMatch(result.stderr, /ENOTDIR/);
	});

	it("使える文字を含まない名前はエラーにする", () => {
		const result = run(tmp, ["日本語"]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Invalid project name/);
	});
});

describe("生成に失敗したとき", () => {
	/** 書き換え対象を消したテンプレートで CLI を動かす */
	const runWithBrokenTemplate = async (args, cwd) => {
		const pkg = await fs.mkdtemp(path.join(tmp, "broken-cli-"));
		await fs.cp(path.dirname(CLI), pkg, {
			recursive: true,
			filter: (src) => !/node_modules|\.git$/.test(path.basename(src)),
		});
		await fs.writeFile(path.join(pkg, "template/README.md"), "no title\n");
		return spawnSync(process.execPath, [path.join(pkg, "index.js"), ...args], {
			cwd,
			encoding: "utf8",
		});
	};

	it("書き換え対象が見つからなければエラーにし、作ったディレクトリを消す", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "fail-"));
		const result = await runWithBrokenTemplate(["app"], cwd);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /README\.md/);
		assert.ok(!existsSync(path.join(cwd, "app")));
	});

	it("既存の空ディレクトリは残し、中身だけを消す", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "fail-existing-"));
		await fs.mkdir(path.join(cwd, "app"));
		const result = await runWithBrokenTemplate(["app"], cwd);
		assert.equal(result.status, 1);
		assert.deepEqual(await fs.readdir(path.join(cwd, "app")), []);
	});
});
