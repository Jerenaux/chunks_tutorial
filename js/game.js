/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 * Modified by Jakub Kasprzyk (github.com/neu5)
 */
var Game = {};

Game.preload = function(){
    Game.scene = this; // Handy reference to the scene (alternative to `this` binding)
    // We will be loading files on the fly, so we need to listen to events triggered when
    // a file (a tilemap, more specifically) is added to the cache
    this.cache.tilemap.events.on('add',function(cache,key){
        Game.displayChunk(key);
    });
    this.load.image('tiles', 'assets/tilesheet_iso.png');
    this.load.image('phaserguy', 'assets/phaserguy.png');
    // This master file contains information about your chunks; see splitter/splitmap.js how it is created
    this.load.json('master', 'assets/map/chunks/master.json');
};

Game.create = function(){
    // Handles the clicks on the map to make the character move
    this.input.on('pointerup',Game.handleClick);

    Game.maps = {}; // Maps chunk id's to the corresponding tilemaps; used to be able to destroy them
    Game.displayedChunks = []; // List of the id's of the chunks currently displayed
    var masterData = this.cache.json.get('master');
    Game.chunkWidth = masterData.chunkWidth;
    Game.chunkHeight = masterData.chunkHeight;
    Game.nbChunksHorizontal = masterData.nbChunksHorizontal;
    Game.nbChunksVertical = masterData.nbChunksVertical;
    Game.lastChunkID = (Game.nbChunksHorizontal*Game.nbChunksVertical)-1;
    Game.mapHeight = masterData.mapHeight;
    Game.mapWidth = masterData.mapWidth;
    Game.tileWidth = masterData.tileWidth;
    Game.tileHeight = masterData.tileHeight;
    Game.HALF_WIDTH_OF_CHUNK = (Game.chunkWidth / 2) * Game.tileWidth;
    Game.HALF_HEIGHT_OF_CHUNK = (Game.chunkHeight / 2) * Game.tileHeight;

    Game.camera = this.cameras.main;

    var phaserGuy = this.add.image(32*10,32*10,'phaserguy');
    phaserGuy.setDepth(1); // So that the ground layer of the newly drawn chunks is not drawn on top of our guy
    Game.camera.startFollow(phaserGuy);
    Game.player = phaserGuy;

    Game.updateEnvironment(); // The core method responsible for displaying/destroying chunks
};

Game.getTileFromXY = (x, y) => ({
    x: Math.floor(y / Game.tileHeight + x / Game.tileWidth),
    y: Math.floor((x / Game.tileWidth - y / Game.tileHeight) * -1)
});

Game.handleClick = function(pointer){
    const x = Game.camera.scrollX + pointer.x;
    const y = Game.camera.scrollY + pointer.y;
    
    const tile = Game.getTileFromXY(x, y);

    // Prevent going outside the map
    if(tile.x < 0 || tile.y < 0 || tile.x >= Game.mapWidth || tile.y >= Game.mapHeight) {
        return;
    }

    Game.player.setPosition(x,y);
    Game.updateEnvironment();
};

// Determines the ID of the chunk on which the player charachter is based on its coordinates in the world
Game.computeChunkID = function(x, y){
    const tile = Game.getTileFromXY(x, y);

    const chunkX = Math.floor(tile.x / Game.chunkWidth);
    const chunkY = Math.floor(tile.y / Game.chunkHeight);
    return (chunkY * Game.nbChunksHorizontal) + chunkX;
};

// Returns the entries in secondArray that are not present in firstArray
Game.findDiffArrayElements = function(firstArray,secondArray){
    return firstArray.filter(function(i) {return secondArray.indexOf(i) < 0;});
};

Game.updateEnvironment = function(){
    var chunkID = Game.computeChunkID(Game.player.x,Game.player.y);
    var chunks = Game.listAdjacentChunks(chunkID); // List the id's of the chunks surrounding the one we are in
    var newChunks = Game.findDiffArrayElements(chunks,Game.displayedChunks); // Lists the surrounding chunks that are not displayed yet (and have to be)
    var oldChunks = Game.findDiffArrayElements(Game.displayedChunks,chunks); // Lists the surrounding chunks that are still displayed (and shouldn't anymore)


    newChunks.forEach(function(c){
        console.log(`loading chunk${c}`);
        Game.scene.load.tilemapTiledJSON(`chunk${c}`, `assets/map/chunks/chunk${c}.json`);
    });
    if(newChunks.length > 0) Game.scene.load.start(); // Needed to trigger loads from outside of preload()

    oldChunks.forEach(function(c){
        console.log('destroying chunk'+c);
        Game.removeChunk(c);
    });
};

Game.displayChunk = function(key){
    const map = Game.scene.make.tilemap({ key });

    // The first parameter is the name of the tileset in Tiled and the second parameter is the key
    // of the tileset image used when loading the file in preload.
    const tiles = map.addTilesetImage('tilesheet_iso', 'tiles');

    // We need to compute the position of the chunk in the world
    const chunkID = parseInt(key.match(/\d+/)[0]); // Extracts the chunk number from file name
    const chunkRow = Math.floor(chunkID / Game.nbChunksHorizontal);
    const chunkCol = chunkID % Game.nbChunksHorizontal;
    const isCenterChunk = (chunkID - chunkRow) % Game.nbChunksHorizontal;

    let offset;

    if (isCenterChunk === 0) {
        offset = {
          x: 0,
          y: chunkRow * Game.HALF_WIDTH_OF_CHUNK,
        };
    } else if (chunkID < Game.nbChunksHorizontal * chunkRow + chunkRow) {
        offset = {
            x:
            -(chunkRow * Game.HALF_WIDTH_OF_CHUNK) +
            (chunkID % Game.nbChunksHorizontal) * Game.HALF_WIDTH_OF_CHUNK,
            y:
            chunkRow * Game.HALF_HEIGHT_OF_CHUNK +
            (chunkID % Game.nbChunksHorizontal) * Game.HALF_HEIGHT_OF_CHUNK,
        };
    } else {
        offset = {
            x:
            ((chunkCol - chunkRow) % Game.nbChunksHorizontal) *
            Game.HALF_WIDTH_OF_CHUNK,
            y: (chunkRow + chunkCol) * Game.HALF_HEIGHT_OF_CHUNK,
        };
    }

    map.createLayer("Ground", tiles, offset.x, offset.y);

    Game.maps[chunkID] = map;
    Game.displayedChunks.push(chunkID);
};

Game.removeChunk = function(chunkID){
    Game.maps[chunkID].destroy();
    Game.scene.cache.tilemap.remove(`chunk${chunkID}`);
    var idx = Game.displayedChunks.indexOf(chunkID);
    if(idx > -1) Game.displayedChunks.splice(idx,1);
};

// Returns the list of chunks surrounding a specific chunk, taking the world borders into
// account. If you find a smarter way to do it, I'm interested!
Game.listAdjacentChunks = function(chunkID){
    var chunks = [];
    var isAtTop = (chunkID < Game.nbChunksHorizontal);
    var isAtBottom = (chunkID > Game.lastChunkID - Game.nbChunksHorizontal);
    var isAtLeft = (chunkID%Game.nbChunksHorizontal == 0);
    var isAtRight = (chunkID%Game.nbChunksHorizontal == Game.nbChunksHorizontal-1);
    chunks.push(chunkID);
    if(!isAtTop) chunks.push(chunkID - Game.nbChunksHorizontal);
    if(!isAtBottom) chunks.push(chunkID + Game.nbChunksHorizontal);
    if(!isAtLeft) chunks.push(chunkID-1);
    if(!isAtRight) chunks.push(chunkID+1);
    if(!isAtTop && !isAtLeft) chunks.push(chunkID-1-Game.nbChunksHorizontal);
    if(!isAtTop && !isAtRight) chunks.push(chunkID+1-Game.nbChunksHorizontal);
    if(!isAtBottom && !isAtLeft) chunks.push(chunkID-1+Game.nbChunksHorizontal);
    if(!isAtBottom && !isAtRight) chunks.push(chunkID+1+Game.nbChunksHorizontal);
    return chunks;
};