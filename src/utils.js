const cli = require("cli-color");

const print = (color, message) => {
    console.log(cli[color](`${new Date().toLocaleTimeString()}  ${message}`));
}

const utils = {
    log: {
        error: message => {
            print("red", message);
        },
        success: message => {
            print("green", message);
        },
        warning: message => {
            print("yellow", message);
        }
    }
}

module.exports = utils
