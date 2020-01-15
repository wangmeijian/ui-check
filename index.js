#!/usr/bin/env node
// const baseReg = /^http(s)?:\/\/(.*)/i
const pathReg = /^.+\.[a-z]+$/i;
const UiCheck = require("./src/index");
const program = require("commander");
const path = require("path");
const os = require("os");
const { exec } = require("child_process");
const { log } = require("./src/utils");

program
  // .option("-b, --base <string>", "base url")
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

const main = () => {
	const configPath = path.resolve(program.config);
	const config = require(configPath);

	new UiCheck(config);
};

// 安装linux依赖
if (os.type().toLowerCase() === 'linux'){
    exec(
        "sudo yum install -y pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 ipa-gothic-fonts xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc",
        error => {
            if(error){
                log(error, 'red');
                return;
            }
            main();
        }
    );
}else{
    main();
}
	


