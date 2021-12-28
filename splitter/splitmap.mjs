/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 * Modified by Jakub Kasprzyk (github.com/neu5)
 */

import { existsSync, mkdirSync, readFile, writeFile } from "fs";
import { join } from "path";
import rimraf from "rimraf";
import optimist from "optimist";
import { fileURLToPath } from "url";

const getDirname = (meta) => fileURLToPath(meta.url);
const dirname = getDirname(import.meta);

const splitMap = (
  fullFileName,
  out = "chunks",
  chunkWidth = 20,
  chunkHeight = 20,
  verbose = false
) => {
  if (!fullFileName) {
    console.log(`ERROR : No file name specified!
-i = path to JSON file of the map to split, relative to assets/map (with or without json extension)
-o = (optional) name of directory where chunks have to be generated (default assets/map/chunks)
-w = (optional) width of the chunks, in tiles (default ${chunkWidth})
-h = (optional) height of the chunks, in tiles (default ${chunkHeight})
-v = (optional) verbose, print out the progress of creating the chunks`);

    return;
  }

  const fileName =
    fullFileName.substr(-5) === ".json"
      ? fullFileName.slice(0, -5)
      : fullFileName;

  const mapsPath = join("..", "..", "assets", "map");
  const outputDirectory = join(dirname, mapsPath, out);

  rimraf.sync(outputDirectory);
  console.log(`Output directory ${out} cleared`);

  if (!existsSync(outputDirectory)) {
    mkdirSync(outputDirectory);
  }

  readFile(
    join(dirname, mapsPath, `${fileName}.json`),
    "utf8",
    (readMapErr, data) => {
      if (readMapErr) {
        throw readMapErr;
      }

      const map = JSON.parse(data);
      const mapWidth = map.width;
      const mapHeight = map.height;
      const nbChunksHorizontal = Math.ceil(mapWidth / chunkWidth);
      const nbChunksVertical = Math.ceil(mapHeight / chunkHeight);
      const nbChunks = nbChunksHorizontal * nbChunksVertical;
      console.log(
        `Splitting into ${nbChunks} chunks (${nbChunksHorizontal} x ${nbChunksVertical}) of size (${chunkWidth} x ${chunkHeight})`
      );
      console.log(`Writing to ${outputDirectory}`);

      // Creates a master file that contains information needed to properly manage the chunks
      const master = {
        tilesets: map.tilesets, // Up to you to decide if having the tilesets data in the master file is useful or not, adapt accordingly (in this case it's not)
        chunkWidth,
        chunkHeight,
        nbChunksHorizontal,
        nbChunksVertical,
        nbLayers: map.layers.length,
        mapHeight: map.height,
        mapWidth: map.width,
        tileWidth: map.tilewidth,
        tileHeight: map.tileheight,
      };

      writeFile(
        join(outputDirectory, "master.json"),
        JSON.stringify(master),
        (writeMasterFileErr) => {
          if (writeMasterFileErr) {
            throw writeMasterFileErr;
          }

          console.log("Master file written");
        }
      );

      let counter = 0;

      for (let i = 0; i < nbChunks; i += 1) {
        const chunk = {
          ...map,
          layers: map.layers.map((layer) => ({
            ...layer,
            data: [...layer.data],
          })),
        };
        // Compute the coordinates of the top-left corner of the chunk in the initial map
        const x = (i % nbChunksHorizontal) * chunkWidth;
        const y = Math.floor(i / nbChunksHorizontal) * chunkHeight;
        chunk.width = Math.min(chunkWidth, mapWidth - x);
        chunk.height = Math.min(chunkHeight, mapHeight - y);
        chunk.id = i;
        // Compute the index of the tiles array of the initial map that corresponds to the top-left tile of the chunk
        const liststart = mapWidth * y + x;

        for (let j = 0; j < chunk.layers.length; j += 1) {
          // Scan all layers one by one
          const layer = chunk.layers[j];
          layer.width = chunk.width;
          layer.height = chunk.height;
          if (layer.type === "tilelayer") {
            let tmpdata = [];
            // In the initial tiles array, fetch the "slices" of tiles that belong to the chunk of interest
            for (let yi = 0; yi < layer.height; yi += 1) {
              const begin = liststart + yi * mapWidth;
              const end = begin + layer.width;
              const line = layer.data.slice(begin, end);
              tmpdata = tmpdata.concat(line);
            }
            layer.data = tmpdata;
          }
        }

        // Update tileset paths
        for (let k = 0; k < chunk.tilesets.length; k += 1) {
          const tileset = chunk.tilesets[k];
          tileset.image = join("..", tileset.image);
        }

        if (verbose) {
          console.log(
            `writing chunk ${i} from ${nbChunks} created (${
              (i / nbChunks) * 100
            }%)`
          );
        }

        writeFile(
          join(outputDirectory, `chunk${i}.json`),
          JSON.stringify(chunk),
          function (writeChunkErr) { // eslint-disable-line
            if (writeChunkErr) {
              throw writeChunkErr;
            }

            counter += 1;

            if (counter === nbChunks) {
              console.log("All chunks created");
            }
          }
        );
      }
    }
  );
};

const { argv } = optimist;
splitMap(argv.i, argv.o, argv.w, argv.h, argv.v);
