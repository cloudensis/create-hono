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
		const quoted = process.platform === "win32" ? '"My App"' : "'My App'";
		assert.ok(result.stdout.includes(`cd ${quoted}`), result.stdout);
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

describe("名前の整形と表示", () => {
	it("連続した区切りは 1 つの - にまとめる", async () => {
		const result = run(tmp, ["My  --  App"]);
		assert.equal(result.status, 0, result.stderr);
		assert.match(result.stdout, /Created my-app /);
	});

	it("シェルの特殊文字を含むパスもクォートして表示する", {
		skip: process.platform === "win32",
	}, () => {
		const result = run(tmp, ["it's $HOME"]);
		assert.equal(result.status, 0, result.stderr);
		assert.ok(result.stdout.includes(`cd 'it'\\''s $HOME'`), result.stdout);
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

	it("Worker 名の上限 (63 文字) を超える名前はエラーにする", async () => {
		const ok = "a".repeat(63);
		assert.equal(run(tmp, [ok]).status, 0);
		const result = run(tmp, ["a".repeat(64)]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /63 characters or fewer/);
		assert.ok(!existsSync(path.join(tmp, "a".repeat(64))));
	});

	it("使える文字を含まない名前はエラーにする", () => {
		const result = run(tmp, ["日本語"]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Invalid project name/);
	});
});
