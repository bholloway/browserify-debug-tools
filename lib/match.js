'use strict';

var inspect = require('./inspect');

/**
 * Match a regular expression in the transformed file's contents and call the given method for each file.
 * @param {RegExp} regex A regular expression to test the file contents
 * @param {function} callback A method to call with the filename and matches for each file
 */
function match(regex, callback) {
  return inspect(onComplete);

  function onComplete(filename, contents, done) {
    callback(filename, contents.match(regex), done);
    if (callback.length < 3) {
      done();
    }
  }
}

module.exports = match;