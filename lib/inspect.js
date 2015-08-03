var through = require('through2');

/**
 * Call the given method for each file on its completion.
 * @param {function(string,string,[function]} callback A method to call with name, contents, and optional done
 */
function inspect(callback) {
  return function (filename) {
    var chunks = [];

    function transform(chunk, encoding, done) {
      /* jshint validthis:true */
      chunks.push(chunk);
      this.push(chunk);
      done();
    }

    function flush(done) {
      callback(filename, chunks.join(''), done);
      if (callback.length < 3) {
        done();
      }
    }

    return through(transform, flush);
  }
}

module.exports = inspect;