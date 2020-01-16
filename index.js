#!/usr/bin/env node
const pathReg = /^.+\.[a-z]+$/i;
const UiCheck = require("./src/index");
const program = require("commander");
const path = require("path");
const { log } = require("./src/utils");

program.requiredOption("-c, --config <string>", "profile path");

program.parse(process.argv);

if (program.config && !pathReg.test(program.config)) {
	log.error(`参数错误: config，示例：ui-check --config /users/config.js`);
	return false;
}

const main = () => {
	const configPath = path.resolve(program.config);
	const config = require(configPath);

	new UiCheck(config);
};

main();
