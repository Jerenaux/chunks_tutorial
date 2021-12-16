/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */
var Game = {};

Game.preload = function(){
    Game.scene = this; // Handy reference to the scene (alternative to `this` binding)
    // We will be loading files on the fly, so we need to listen to events triggered when
    // a file (a tilemap, more specifically) is added to the cache
    this.cache.tilemap.events.on('add',function(cache,key){
        Game.displayChunk(key);
    });
    this.load.image('tiles', 'assets/tilesheet.png');
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

    Game.camera = this.cameras.main;
    var worldWidth = masterData.nbChunksHorizontal*masterData.chunkWidth; // width of the world in tiles
    var worldHeight = masterData.nbChunksVertical*masterData.chunkHeight; // height of the world in tiles
    Game.camera.setBounds(0, 0, worldWidth*32, worldHeight*32);

    var phaserGuy = this.add.image(32*10,32*10,'phaserguy');
    phaserGuy.setDepth(1); // So that the ground layer of the newly drawn chunks is not drawn on top of our guy
    Game.camera.startFollow(phaserGuy);
    Game.player = phaserGuy;

    Game.updateEnvironment(); // The core method responsible for displaying/destroying chunks
};

Game.handleClick = function(pointer){
    var x = Game.camera.scrollX + pointer.x;
    var y = Game.camera.scrollY + pointer.y;
    Game.player.setPosition(x,y);
    Game.updateEnvironment();
};

// Determines the ID of the chunk on which the player charachter is based on its coordinates in the world
Game.computeChunkID = function(x,y){
    var tileX = Math.floor(x/32);
    var tileY = Math.floor(y/32);
    var chunkX = Math.floor(tileX/Game.chunkWidth);
    var chunkY = Math.floor(tileY/Game.chunkHeight);
    return (chunkY*Game.nbChunksHorizontal)+chunkX;
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
        console.log('loading chunk'+c);
        Game.scene.load.tilemapTiledJSON('chunk'+c, 'assets/map/chunks/chunk'+c+'.json');
    });
    if(newChunks.length > 0) Game.scene.load.start(); // Needed to trigger loads from outside of preload()

    oldChunks.forEach(function(c){
        console.log('destroying chunk'+c);
        Game.removeChunk(c);
    });
};

Game.displayChunk = function(key){
    var map = Game.scene.make.tilemap({ key: key});

    // The first parameter is the name of the tileset in Tiled and the second parameter is the key
    // of the tileset image used when loading the file in preload.
    var tiles = map.addTilesetImage('tilesheet', 'tiles');

    // We need to compute the position of the chunk in the world
    var chunkID = parseInt(key.match(/\d+/)[0]); // Extracts the chunk number from file name
    var chunkX = (chunkID%Game.nbChunksHorizontal)*Game.chunkWidth;
    var chunkY = Math.floor(chunkID/Game.nbChunksHorizontal)*Game.chunkHeight;

    for(var i = 0; i < map.layers.length; i++) {
        // You can load a layer from the map using the layer name from Tiled, or by using the layer
        // index
        var layer = map.createLayer(i, tiles, chunkX*32, chunkY*32);
        // Trick to automatically give different depths to each layer while avoid having a layer at depth 1 (because depth 1 is for our player character)
        layer.setDepth(2*i);
    }

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