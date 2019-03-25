const translator = require('./matlab_to_julia_translator');
var assert = require('assert');

assert("hello world" === translator.translate("hello world"));