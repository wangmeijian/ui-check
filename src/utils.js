const utils = {
  log: (message, color = 'green') => {
    const colors = {
      red: '\x1b[31m ',
      green: '\x1b[32m ',
      yellow: '\x1b[33m '
    }
    console.log(`${colors[color]}${new Date().toLocaleTimeString()}  ${message} \x1b[0m`)
  }
}

module.exports = utils
