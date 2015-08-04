'use strict';

var path = require('path');

var inspect = require('./inspect');

/**
 * Analyse one or more transforms which perform a bulk action on stream flush.
 * @param {RegExp} [excludeRegex] Optionally exclude files
 * @param {{forCategory:function, start:function, stop:function, report:function, toString:function}} A new instance
 */
function profile(excludeRegex) {
  var categories = [];
  return {
    forCategory: forCategory,
    toArray    : toArray,
    toString   : toString
  };

  function toArray() {
    return categories;
  }

  function toString() {
    return categories
      .map(String)
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Create a category for analysis.
   * @param {string} [label] Optional category label
   * @param {{forCategory:function, start:function, stop:function, report:function, toString:function}} A new instance
   */
  function forCategory(label) {
    var eventsByFilename = {},
        isUsed           = false,
        self             = {
          forCategory: forCategory,
          start      : start,
          stop       : stop,
          report     : report,
          toString   : toString
        };

    label = label || ('category-' + String.fromCharCode(65 + categories.length));
    categories.push(self);
    return self;

    /**
     * Start a segment delineated by the given key.
     * @param {string} key A key to delineate a segment
     * @returns {function} A transform that causes a start event when the file is completed streaming
     */
    function start(key) {
      return createEventTransform(key);
    }

    /**
     * Stop the currently delineated segment.
     * @returns {function} A transform that causes a stop event when the file is completed streaming
     */
    function stop() {
      return createEventTransform(null);
    }

    /**
     * Create a transform that pushes time-stamped events data to the current filename.
     * @param {*} data The event data
     * @returns {function} A browserify transform that captures events on file contents complete
     */
    function createEventTransform(data) {
      return inspect(onComplete);

      function onComplete(filename) {
        isUsed = true;
        var now = Date.now();
        var events = eventsByFilename[filename] = eventsByFilename[filename] || [];
        events.push(now, data);
      }
    }

    /**
     * Create a json report of time verses key verses filename.
     */
    function report() {
      return Object.keys(eventsByFilename)
        .filter(testIncluded)
        .reduce(reduceFilenames, {});

      function testIncluded(filename) {
        return !excludeRegex || !excludeRegex.test(filename);
      }

      function reduceFilenames(reduced, filename) {
        var totalsByKey = {},
            list        = eventsByFilename[filename],
            lastKey     = null,
            lastTime    = NaN;

        // events consist of time,key pairs
        for (var i = 0; i < list.length; i += 2) {
          var time = list[i],
              key  = list[i + 1];
          if (lastKey) {
            var initial = totalsByKey[key] || 0,
                delta   = ((time - lastTime) / 1000) || 0;
            totalsByKey[lastKey] = initial + delta;
          }
          lastKey = key;
          lastTime = time;
        }

        // total at the end to guarantee consistency
        var total = 0;
        for (var key in totalsByKey) {
          total += totalsByKey[key];
        }
        totalsByKey.total = total;

        // store by the short filename
        var short = path.relative(process.cwd(), filename);
        reduced[short] = totalsByKey;
        return reduced;
      }
    }

    /**
     * A string representation of the report, sorted by longest time.
     */
    function toString() {
      var json            = report(),
          filenames       = Object.keys(json),
          longestFilename = filenames.reduce(reduceFilenamesToLength, 0),
          columnOrder     = orderColumns(),
          headerRow       = [label].concat(columnOrder).map(leftJustify).join(' '),
          delimiter       = (new Array(headerRow.length + 1)).join('-');

      if (isUsed) {
        return [delimiter, headerRow, delimiter]
          .concat(rows())
          .concat(delimiter)
          .filter(Boolean)
          .join('\n');
      } else {
        return '';
      }

      /**
       * Establish the column names, in order, left justified (for the maximum length).
       */
      function orderColumns() {
        var keyTotals = filenames.reduce(reduceFilenamesToKeyTotal, {});
        return sort(keyTotals);

        function reduceFilenamesToKeyTotal(reduced, filename) {
          var item = json[filename];
          return Object.keys(item)
            .reduce(reducePropToLength.bind(item), reduced);
        }
      }

      /**
       * Map each filename to a data row, in decreasing time order.
       */
      function rows() {
        var fileTotals = filenames.reduce(reducePropToLength.bind(json), {}),
            fileOrder  = sort(fileTotals);
        return fileOrder.map(rowForFile);

        function rowForFile(filename) {
          var data = json[filename];
          //          console.log(JSON.stringify(data, null, 2));
          return [filename]
            .concat(columnOrder
              .map(dataForColumn)
              .map(formatFloat))
            .map(leftJustify)
            .join(' ');

          function dataForColumn(column) {
            return data[column];
          }

          function formatFloat(number) {
            var padding  = '000',
                warning  = ((number > 99) ? '>' : ' '),
                integer  = (padding + Math.min(99, Math.floor(number))).slice(-2),
                fraction = (padding + Math.round(1000 * number)).slice(-3);
            return warning + integer + '.' + fraction;
          }
        }
      }

      function reduceFilenamesToLength(reduced, filename) {
        return Math.max(filename.length, reduced);
      }

      function leftJustify(name, i) {
        var length = i ? Math.max(7, columnOrder[i - 1].length) : longestFilename;
        var padding = (new Array(length + 1)).join(' ');
        return (name + padding).slice(0, length);
      }

      function reducePropToLength(reduced, key) {
        var value = (typeof this[key] === 'object') ? this[key].total : this[key];
        reduced[key] = (reduced[key] || 0) + value;
        return reduced;
      }

      function sort(object) {
        return Object.keys(object)
          .reduce(createObjects.bind(object), [])
          .sort(sortTimeDescending)
          .map(getColumnName);

        function createObjects(reduced, field) {
          reduced.push({
            name: field,
            time: Math.round(this[field] * 1000) / 1000  // millisecond precision
          });
          return reduced;
        }

        function sortTimeDescending(a, b) {
          return b.time - a.time;
        }

        function getColumnName(object) {
          return object.name;
        }
      }
    }
  }
}

module.exports = profile;