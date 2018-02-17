/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */
var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 500,
    parent: 'game',
    scene: [Game]
};

var game = new Phaser.Game(config);
