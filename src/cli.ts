#!/usr/bin/env node

import commander from 'commander';

import * as fs from 'fs';
import * as REPL from 'repl';

// this import messes up the package structure after running tsc
// import * as pkg from '../package.json';
import { connect } from './';
import log from './log';
import XAPI from './xapi/index.js';

const pkg = { version: '4.2.0' };

function evalFile(source: any, xapi: XAPI) {
  const context = new Function('xapi', source); // eslint-disable-line no-new-func
  context(xapi);
}

function startRepl(xapi: XAPI) {
  const repl = REPL.start({});
  repl.on('exit', () => xapi.close());
  repl.context.xapi = xapi;
}

commander
  .version(pkg.version)
  .arguments('<host> [file]')
  .description('connect to a codec and launch a repl')
  .option('-p, --port <port>', 'port to connect to', 22)
  .option('-U, --username <user>', 'username to authenticate with', 'admin')
  .option('-P, --password <password>', 'password to authenticate with', '')
  .option('-C, --command <command>', 'command to execute on remote host', '')
  .option(
    '-l, --loglevel <level>',
    'set application log level (trace|debug|info|warn|error|silent)',
    /^(trace|debug|info|warn|error|silent)$/i,
    'warn',
  )
  .action((host, file, options) => {
    if (!host) {
      log.error('Please specify a host to connect to');
      commander.help();
    }

    const source = file && fs.readFileSync(file);
    const xapi = connect(
      host,
      options,
    )
      .on('error', (error: any) => {
        log.error('xapi error:', error);
      })
      .on('ready', () => {
        if (source) {
          evalFile(source, xapi);
        } else {
          startRepl(xapi);
        }
      });
  })
  .parse(process.argv);
