'use strict';

var inspect = require('./inspect'),
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
  return inspect(onComplete);

  function onComplete(filename, contents, done) {
    if (!regex || regex.test(filename)) {
      var newName = [filename, extension || 'gen'].join('.');
      fs.writeFile(newName, contents, done);
    } else {
      done();
    }
  }
}

module.exports = dumpToFile;