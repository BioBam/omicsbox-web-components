#!/usr/bin/env node

'use strict';

const path = require('path');
const shell = require('shelljs');
const fs = require('fs');

var bp = path.join(__dirname, 'build');
shell.rm('-rf', bp);

shell.exec(`rollup -c`)
