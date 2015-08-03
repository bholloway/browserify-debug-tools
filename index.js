/**
 * Tools for debugging Browserify transforms.
 * @see https://github.com/bholloway/browserify-debug-tools
 * @author bholloway
 */

module.exports = {
  inspect   : require('./lib/inspect'),
  dumpToFile: require('./lib/dump-to-file'),
  match     : require('./lib/match'),
  profile   : require('./lib/profile')
};
