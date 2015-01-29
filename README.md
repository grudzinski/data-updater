# data-updater

## Install

```sh
npm install --save data-updater
```

## Use

```js
var DataUpdater = require('data-updater');

var dataUpdater = new DataUpdater('path/to/data.json', 1000);

dataUpdater.on('error', function(err) {
	// Runs if an error occurs to read the data file
});

dataUpdater.on('old', function() {
	// Runs when data file was not updated since last attempt
});

dataUpdater.on('update', function(data) {
	// Runs when data file was updated sice last attempt
})

```
