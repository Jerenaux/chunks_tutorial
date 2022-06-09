/* global Phaser */

/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 * Modified by Jakub Kasprzyk (github.com/neu5)
 */

import { IDToXY, getSurroundingTiles } from "./utils.js";

// Returns the entries in secondArray that are not present in firstArray
const findDiffArrayElements = (firstArray, secondArray) =>
  firstArray.filter((i) => secondArray.indexOf(i) < 0);

class Game extends Phaser.Scene {
  constructor() {
    super("Game");
  }

  getTileFromXY(x, y) {
    return {
      x: Math.floor(y / this.tileHeight + x / this.tileWidth),
      y: Math.floor((x / this.tileWidth - y / this.tileHeight) * -1),
    };
  }

  handleClick(pointer) {
    const { scene } = this;
    const x = scene.camera.scrollX + pointer.x;
    const y = scene.camera.scrollY + pointer.y;

    const tile = scene.getTileFromXY(x, y);

    // Move only inside of the map
    if (
      tile.x >= 0 &&
      tile.y >= 0 &&
      tile.x < scene.mapWidth &&
      tile.y < scene.mapHeight
    ) {
      scene.player.setPosition(x, y);
      scene.updateEnvironment();
    }
  }

  getChunkXYFromPlayerXY(x, y) {
    const tile = this.getTileFromXY(x, y);

    return [
      Math.floor(tile.x / this.chunkWidth),
      Math.floor(tile.y / this.chunkHeight),
    ];
  }

  // Determines the ID of the chunk on which the player charachter is based on its coordinates in the world
  computeChunkID(chunkX, chunkY) {
    return chunkY * this.nbChunksX + chunkX;
  }

  updateEnvironment() {
    const chunkID = this.computeChunkID(
      ...this.getChunkXYFromPlayerXY(this.player.x, this.player.y)
    );
    // const chunks = this.listAdjacentChunks(chunkID); // List the id's of the chunks surrounding the one we are in

    const chunks = getSurroundingTiles({
      positionTile: IDToXY({
        ID: chunkID,
        nbChunksX: this.nbChunksX,
        nbChunksY: this.nbChunksY,
      }),
      includeMainObject: true,
      endX: this.nbChunksX - 1,
      endY: this.nbChunksY - 1,
    }).map(({ x, y }) => this.computeChunkID(x, y));

    const newChunks = findDiffArrayElements(chunks, this.displayedChunks); // Lists the surrounding chunks that are not displayed yet (and have to be)
    const oldChunks = findDiffArrayElements(this.displayedChunks, chunks); // Lists the surrounding chunks that are still displayed (and shouldn't anymore)

    newChunks.forEach((chunk) => {
      console.log(`loading chunk${chunk}`);
      this.load.tilemapTiledJSON(
        `chunk${chunk}`,
        `assets/map/chunks/chunk${chunk}.json`
      );
    });

    if (newChunks.length > 0) {
      this.load.start(); // Needed to trigger loads from outside of preload()
    }

    oldChunks.forEach((chunk) => {
      console.log(`destroying chunk${chunk}`);
      this.removeChunk(chunk);
    });
  }

  displayChunk(key) {
    const map = this.make.tilemap({ key });

    // The first parameter is the name of the tileset in Tiled and the second parameter is the key
    // of the tileset image used when loading the file in preload.
    const tiles = map.addTilesetImage("tilesheet_iso", "tiles");

    // We need to compute the position of the chunk in the world
    const chunkID = parseInt(key.match(/\d+/)[0], 10); // Extracts the chunk number from file name
    const chunkX = Math.floor(chunkID / this.nbChunksX);
    const chunkY = chunkID % this.nbChunksX;
    const isCenterChunk = (chunkID - chunkX) % this.nbChunksX;

    let offset;

    if (isCenterChunk === 0) {
      offset = {
        x: 0,
        y: chunkX * this.chunkHalfWidth,
      };
    } else if (chunkID < this.nbChunksX * chunkX + chunkX) {
      offset = {
        x:
          -(chunkX * this.chunkHalfWidth) +
          (chunkID % this.nbChunksX) * this.chunkHalfWidth,
        y:
          chunkX * this.chunkHalfHeight +
          (chunkID % this.nbChunksX) * this.chunkHalfHeight,
      };
    } else {
      offset = {
        x: ((chunkY - chunkX) % this.nbChunksX) * this.chunkHalfWidth,
        y: (chunkX + chunkY) * this.chunkHalfHeight,
      };
    }

    map.createLayer("Ground", tiles, offset.x, offset.y);

    this.maps[chunkID] = map;
    this.displayedChunks.push(chunkID);
  }

  removeChunk(chunkID) {
    this.maps[chunkID].destroy();
    delete this.maps[chunkID];
    this.cache.tilemap.remove(`chunk${chunkID}`);

    const idx = this.displayedChunks.indexOf(chunkID);

    if (idx > -1) {
      this.displayedChunks.splice(idx, 1);
    }
  }

  // Returns the list of chunks surrounding a specific chunk, taking the world borders into
  // account. If you find a smarter way to do it, I'm interested!
  listAdjacentChunks(chunkID) {
    const chunks = [];
    const isAtTop = chunkID < this.nbChunksX;
    const isAtBottom = chunkID > this.lastChunkID - this.nbChunksX;
    const isAtLeft = chunkID % this.nbChunksX === 0;
    const isAtRight = chunkID % this.nbChunksX === this.nbChunksX - 1;
    chunks.push(chunkID);
    if (!isAtTop) chunks.push(chunkID - this.nbChunksX);
    if (!isAtBottom) chunks.push(chunkID + this.nbChunksX);
    if (!isAtLeft) chunks.push(chunkID - 1);
    if (!isAtRight) chunks.push(chunkID + 1);
    if (!isAtTop && !isAtLeft) chunks.push(chunkID - 1 - this.nbChunksX);
    if (!isAtTop && !isAtRight) chunks.push(chunkID + 1 - this.nbChunksX);
    if (!isAtBottom && !isAtLeft) chunks.push(chunkID - 1 + this.nbChunksX);
    if (!isAtBottom && !isAtRight) chunks.push(chunkID + 1 + this.nbChunksX);

    return chunks;
  }

  preload() {
    // We will be loading files on the fly, so we need to listen to events triggered when
    // a file (a tilemap, more specifically) is added to the cache
    this.cache.tilemap.events.on("add", (cache, key) => {
      this.displayChunk(key);
    });
    this.load.image("tiles", "assets/tilesheet_iso.png");
    this.load.image("phaserguy", "assets/phaserguy.png");
    // This master file contains information about your chunks; see splitter/splitmap.js how it is created
    this.load.json("master", "assets/map/chunks/master.json");
  }

  create() {
    // Handles the clicks on the map to make the character move
    this.input.on("pointerup", this.handleClick);

    this.maps = {}; // Maps chunk id's to the corresponding tilemaps; used to be able to destroy them
    this.displayedChunks = []; // List of the id's of the chunks currently displayed

    const {
      chunkHeight,
      chunkWidth,
      nbChunksX,
      nbChunksY,
      tileWidth,
      tileHeight,
      mapHeight,
      mapWidth,
    } = this.cache.json.get("master");

    this.chunkWidth = chunkWidth;
    this.chunkHeight = chunkHeight;
    this.nbChunksX = nbChunksX;
    this.nbChunksY = nbChunksY;
    this.mapHeight = mapHeight;
    this.mapWidth = mapWidth;
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;

    this.lastChunkID = this.nbChunksX * this.nbChunksY - 1;
    this.chunkHalfWidth = (this.chunkWidth / 2) * this.tileWidth;
    this.chunkHalfHeight = (this.chunkHeight / 2) * this.tileHeight;

    this.camera = this.cameras.main;

    const phaserGuy = this.add.image(32 * 10, 32 * 10, "phaserguy");
    phaserGuy.setDepth(1); // So that the ground layer of the newly drawn chunks is not drawn on top of our guy
    this.camera.startFollow(phaserGuy);
    this.player = phaserGuy;

    this.updateEnvironment(); // The core method responsible for displaying/destroying chunks
  }
}

export { Game };
