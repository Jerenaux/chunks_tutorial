# chunks_tutorial
Small demo showing how to load and manage tilemap chunks on the fly as the player moves, with Phaser 3. You can see it in action in the [online demo](https://jerenaux.github.io/chunks_tutorial/). Note that the loading of the chunks should be almost invisible, so if the demo works well there won't be that much to see! You can have a look at [this gif](http://www.dynetisgames.com/wp-content/uploads/2017/07/test2.gif.pagespeed.ce.ThPirHNwQq.gif) to see it in action with smaller chunks where the effect becomes visible.

The tutorial corresponding to this demo [is available here](http://www.dynetisgames.com/2018/02/24/manage-big-maps-phaser-3/).

## Running the demo

Place all the files on your local web server and navigate to index.html. 

You can move around by clicking on the map. The tilemap chunks will be loaded and discarded on the fly so that only the surrounding chunks are displayed at any time.

## Splitting a map

The folder `splitter` contains a Node app that allows you to split a Tiled map in chunks of arbitrary dimensions. To use it, first install the required
dependencies by running `npm install` in the `splitter` directory. Then run `node splitmap.js`. Run it without any arguments to see a message listing
the possible (and required) options.
