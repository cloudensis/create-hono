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

describe("オプション", () => {
	it("--help で使い方を表示し、ディレクトリを作らない", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "help-"));
		for (const flag of ["--help", "-h"]) {
			const result = run(cwd, [flag]);
			assert.equal(result.status, 0, result.stderr);
			assert.match(result.stdout, /Usage:/);
		}
		assert.deepEqual(await fs.readdir(cwd), []);
	});

	it("--version でバージョンを表示する", async () => {
		const pkg = JSON.parse(
			await fs.readFile(new URL("../package.json", import.meta.url), "utf8"),
		);
		for (const flag of ["--version", "-v"]) {
			const result = run(tmp, [flag]);
			assert.equal(result.status, 0, result.stderr);
			assert.equal(result.stdout.trim(), pkg.version);
		}
	});

	it("未知のオプションはエラーにする", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "unknown-"));
		const result = run(cwd, ["--foo"]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /--foo/);
		assert.deepEqual(await fs.readdir(cwd), []);
	});

	it("引数が多すぎるときはエラーにする", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "too-many-"));
		const result = run(cwd, ["a", "b"]);
		assert.equal(result.status, 1);
		assert.match(result.stderr, /Too many arguments/);
		assert.deepEqual(await fs.readdir(cwd), []);
	});

	it("-- のあとは - で始まる名前も使える", async () => {
		const cwd = await fs.mkdtemp(path.join(tmp, "dashdash-"));
		const result = run(cwd, ["--", "-app"]);
		assert.equal(result.status, 0, result.stderr);
		assert.ok(existsSync(path.join(cwd, "-app/package.json")));
	});
});
