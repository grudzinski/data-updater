# data-updater

## Install

```sh
npm install --save data-updater
```

## Use

```js
var dataUpdater = require('data-updater');

var updater = dataUpdater.fromFile('path/to/data.json', 1000);

updater.on('error', function(err) {
	// Runs if an error occurs to read the data file
});

updater.on('old', function() {
	// Runs when data file was not updated since last attempt
});

updater.on('update', function(data) {
	// Runs when data file was updated sice last attempt
})

```
