#!/usr/bin/env node
// const baseReg = /^http(s)?:\/\/(.*)/i
const pathReg = /^[\.\w-/:\s\u4e00-\u9fa5]*[a-z]+\.[a-z]+$/i;
const UiCheck = require("./src/index");
const { log } = require("./src/utils");
const program = require("commander");
const path = require("path");

program
  .option("-b, --base <string>", "base url")
  .requiredOption("-c, --config <string>", "profile path");

program.parse(process.argv);

// if (program.base && !baseReg.test(program.base)) {
//   log(`参数错误: base，示例：ui-check --base http://example.com/`, "red");
//   return false;
// }

// if (program.base) {
//   new UiCheck({
//     base: program.base
//   });
//   return false;
// }

if (program.config && !pathReg.test(program.config)) {
  log(
		`参数错误: config，示例：ui-check --config /users/config.js`,
		"red"
	);
  return false;
}

const configPath = path.resolve(program.config);
const config = require(configPath);

new UiCheck(config);
