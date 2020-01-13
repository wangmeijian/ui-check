#!/usr/bin/env node
const argv = require('yargs').argv
const uc = require('./src/index')
const { log } = require('./src/utils')

const hostReg = /^http(s)?:\/\/(.*)/i
const pathReg = /^[\.\w-/:\s\u4e00-\u9fa5]*[a-z]+\.[a-z]+$/i

if (argv.host && !hostReg.test(argv.host)) {
  log(`Invalid parameters host: string value expected`, 'red');
  return false;
}
if (argv.config && !pathReg.test(argv.config)) {
  log(`Invalid parameters config: file path expected`, 'red');
  return false;
}

