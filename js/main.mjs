/* global Phaser */

/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 07-02-18.
 */

import { Game } from "./game.mjs";

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 500,
  parent: "game",
  scene: [Game],
};

const game = new Phaser.Game(config); // eslint-disable-line
