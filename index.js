/**
 * Tools for debugging Browserify transforms.
 * @see https://github.com/bholloway/browserify-debug-tools
 * @author bholloway
 */
'use strict';

var through = require('through2'),
    fs      = require('fs');

/**
 * Transform that writes out the current state of the transformed file next to the original source file.
 * Primarily for source map visualisation.
 * @see http://sokra.github.io/source-map-visualization
 * @param {string} [extension] An extention to append to the file
 * @param {RegExp} [regex] A filename filter
 * @returns {function} Browserify transform
 */
function dumpToFile(extension, regex) {
  return function(file) {
    var chunks = [];

    function transform(chunk, encoding, done) {
      /* jshint validthis:true */
      chunks.push(chunk);
      this.push(chunk);
      done();
    }

    function flush(done) {
      if (!regex || regex.test(file)) {
        var filename = [file, extension || 'gen'].join('.');
        var data     = chunks.join('');
        fs.writeFile(filename, data, done);
      } else {
        done();
      }
    }

    return through(transform, flush);
  };
}

/**
 * Match a regular expression in the transformed file and call the given method for each file.
 * @param {RegExp} regex A regular expression to test
 * @param {function} callback A method to call with the matches for each file
 */
function match(regex, callback) {
  return function(file) {
    var chunks = [];

    function transform(chunk, encoding, done) {
      /* jshint validthis:true */
      chunks.push(chunk);
      this.push(chunk);
      done();
    }

    function flush(done) {
      callback(file, chunks.join('').match(regex));
      done();
    }

    return through(transform, flush);
  };
}

module.exports = {
  dumpToFile: dumpToFile,
  match     : match
};
