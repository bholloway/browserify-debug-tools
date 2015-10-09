# Browserify Debug Tools

[![NPM](https://nodei.co/npm/browserify-debug-tools.png)](https://github.com/bholloway/browserify-debug-tools)

Tools for debugging Browserify transforms.

## Limitations

All of the debug tools are factories for a [browserify](http://browserify.org/) transform.

They assume the programmatic API and, out of the box, will **not work with the command-line** browserify tool.

However it may be possible to make a package that simply invokes the factory method and exports the resulting transform as something that the command line tool may use. But in the case of the `profile` tool you will have no means to dump the resulting report.

## Usage

In general, the debug tools should be invoked between your existing transforms in your transform list.

In the examples below we will simplify the browserify invocation to just the transforms.

```javascript
var bundler = browserify({
	...,
    transforms: // below we will only show the transform list
});
...
bundler.bundle()
```

### inspect

Call the given method for each transformed file on its completion.

```javascript
transforms: [ ..., inspect(callback), ... ]
```

Parameters

* **callback** A method to call with name, contents, and optional async done

	```javascript
	function(name, contents, [done]);
	```

Examples

* You could use `console.log` as the callback, but expect a log of output.

	```javascript
	transforms: [ ..., inspect(console.log), ... ]
	```
	
### dumpToFile

Transform that writes out the current state of the transformed file next to the original source file.

Particularly helpful for [source map visualisation](http://sokra.github.io/source-map-visualization).

```javascript
transforms: [ ..., dumpToFile(extension, regex), ... ]
```

Parameters

* **extension** An optional extention to append to the file (defaults to 'gen' meaning generated)
* **regex** An optional filename filter

Examples

* Write the intermediate state of `foo.js` to `foo.gen.js`.

	```javascript
	transforms: [ ..., dumpToFile(null, /foo.js$/), ... ]
	```

* Write the intermediate state of all files, before and after transform `bar`.

	```javascript
	transforms: [ ..., dumpToFile('before'), bar, dumpToFile('after'), ... ]
	```
	
### match

Match a regular expression in the transformed file's contents and call the given method for each file.

```javascript
transforms: [ ..., match(regex, callback), ... ]
```

Parameters

 * **regex** A regular expression to test the file contents
 * **callback** A method to call with the filename and matches for each file

	```javascript
	function(name, matches, [done]);
	```

Note that the callback is called for all files, regardless of whether the regex produced any matches.

Examples

 * Display all matches for text `foo` in all files.

	```javascript
	transforms: [ ..., match(/foo/g, console.log), ... ]
	```

### profile

Analyse one or more transforms which perform a bulk action on stream flush.

```javascript
var profiler = profile();
var category = profiler.forCategory();
...
transforms: [
	category.start('bar'),
	barTransform,
	category.stop('bar'), // may be omitted since start() follows immediately after
	category.start('baz'),
	bazTransform,
	category.stop('baz')
]
```

The root entity is the **profiler**.

Parameters

* **excludeRegex** Optional regex to exclude filenames from profiling

The profiler may create any number of **categories**.

Parameters

* **label** An optional category label

Which themselves create the transforms that delineate **segments**. Timing information is averaged per each segment.

Each normal transform should be preceded by a **start()** and followed by a **stop()**. Any stop that is immediately followed by a start may be **omitted**.

* **key** A key to delineate a segment

Examples:

* Output a report on all categories whenever a bundle is completed

	```javascript
	bundler.bundle()
		...
		.on('data', function() {
				console.log(profiler);
		});
	```

* Output a report on a single category whenever a bundle is completed

	```javascript
	bundler.bundle()
		...
		.on('data', function() {
				console.log(category);
		});
	```

