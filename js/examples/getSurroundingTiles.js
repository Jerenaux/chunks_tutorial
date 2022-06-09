import { IDToXY, getObjectTiles, getSurroundingTiles } from "../utils.js";

const root = document.getElementById("root");

const fragment = new DocumentFragment();
const tiles = [];
const nbChunksX = 16;

// create the tiles
for (let i = 0; i < 272; i += 1) {
  const block = document.createElement("div");
  block.classList.add("block");
  block.textContent = i;

  tiles.push(block);

  fragment.appendChild(block);
}

root.appendChild(fragment);

const XYToID = ({ x, y }) => (x % nbChunksX) + y * nbChunksX;

const showRange = (range, mainObj) => {
  tiles.forEach((tile) => tile.classList.remove("element", "range"));

  range.forEach((tile) => tiles[XYToID(tile)].classList.add("range"));

  if (mainObj.includeMainObject) {
    const objRange = getObjectTiles(mainObj);

    if (objRange.length) {
      objRange.forEach((el) => tiles[XYToID(el)].classList.add("element"));
    }
  }
};

const inputTileID = document.getElementById("input-tile-id");
const inputSizeX = document.getElementById("input-size-x");
const inputSizeY = document.getElementById("input-size-y");
const inputSizeToIncreaseX = document.getElementById(
  "input-size-to-increase-x"
);
const inputSizeToIncreaseY = document.getElementById(
  "input-size-to-increase-y"
);
const inputIncludeMainObj = document.getElementById(
  "input-include-main-object"
);
const submitBtn = document.getElementById("btn-submit");

const getRange = (ID) => {
  const size = {
    x: inputSizeX.value ? Number(inputSizeX.value) : 1,
    y: inputSizeY.value ? Number(inputSizeY.value) : 1,
  };
  const sizeToIncrease = {
    x: inputSizeToIncreaseX.value ? Number(inputSizeToIncreaseX.value) : 1,
    y: inputSizeToIncreaseY.value ? Number(inputSizeToIncreaseY.value) : 1,
  };

  const mainObj = {
    positionTile: IDToXY({ ID, nbChunksX }),
    tileID: ID,
    size,
    sizeToIncrease,
    includeMainObject: inputIncludeMainObj.checked,
  };

  const range = getSurroundingTiles({
    ...mainObj,
    endX: nbChunksX - 1,
    endY: nbChunksX - 1,
  });

  return { range, mainObj };
};

submitBtn.addEventListener("click", () => {
  const { range, mainObj } = getRange(Number(inputTileID.value));

  showRange(range, mainObj);
});
