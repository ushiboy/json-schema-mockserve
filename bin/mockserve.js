#!/usr/bin/env node

var program = require('commander'),
  path = require('path');
program
.version(require('../package.json').version)
.usage('<file> [options]')
.option('-p, --port [port]', 'Set port. Default is 3000.', 3000)
.parse(process.argv);

var schemaFilePath = program.args[0];
if (schemaFilePath === undefined) {
  program.help();
  process.exit(1);
} else {
  var MockServe = require('../lib/MockServe');
  if (!path.isAbsolute(schemaFilePath)) {
    schemaFilePath = path.join(process.cwd(), schemaFilePath);
  }
  new MockServe({
    port: parseInt(program.port, 10),
    path: schemaFilePath
  }).start();
}
