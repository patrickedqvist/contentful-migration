#!/usr/bin/env node
import Observable from 'zen-observable';

global.Observable = Observable;
require('any-observable/register')('global.Observable');
const main = require('./main');

main();
