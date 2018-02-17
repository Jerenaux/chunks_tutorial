# chunks_tutorial
Small demo showing how to load and manage tilemap chunks on the fly with Phaser 3.

The tutorial corresponding to this demo has yet to be written.

## Running the demo

Place all the files on your local web server and navigate to index.html. 

You can move around by clicking on the map. The tilemap chunks will be loaded and discarded on the fly so that only the surrounding chunks are displayed at any time.

## Splitting a map

The folder `splitter` contains a Node app that allows you to split a Tiled map in chunks of arbitrary dimensions. To use it, first install the required
dependencies by running `npm install` in the `splitter` directory. Then run `node splitmap.js`. Run it without any arguments to see a message listing
the possible (and required) options.
