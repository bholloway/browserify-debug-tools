'use strict';

var inspect = require('./inspect');

/**
 * Match a regular expression in the transformed file's contents and call the given method for each file.
 * @param {RegExp} regex A regular expression to test the file contents
 * @param {function} callback A method to call with the matches for each file
 */
function match(regex, callback) {
  return inspect(onComplete);

  function onComplete(filename, contents) {
    callback(filename, contents.match(regex));
  }
}

module.exports = match;