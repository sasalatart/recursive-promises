var Promise = require('bluebird');
var fs = require('fs');
var pathResolve = require('path').resolve;

function readdirPromise(path) {
  return new Promise(function(resolve, reject) {
    fs.readdir(path, function(err, paths) {
      err ? reject(err) : resolve(paths);
    });
  });
}

function readFilePromise(path) {
  //if (Math.random() <= 0.1) throw new Error('Banner UC');
  return new Promise.resolve(path);
}

function isDirectory(path) {
  return fs.lstatSync(path).isDirectory();
}

function explore(dir) {
  return readdirPromise(dir)
  .then(function(paths) {
    return Promise.all(paths.map(function(path) {
      path = pathResolve(dir, path);
      return isDirectory(path) ? explore(path) : readFilePromise(path);
    }));
  })
  .catch(function(err) {
    console.log(err);
    throw err;
  });
}

function flatten(arr) {
  return arr.reduce(function(flat, toFlatten) {
    return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
  }, []);
}

function printArray(arr) {
  console.log(JSON.stringify(arr, null, 4));
}

explore(pathResolve('.', 'test'))
.then(function(results) {
  printArray(flatten(results));
})
.catch(function(err) {
  console.log('Fail');
});
