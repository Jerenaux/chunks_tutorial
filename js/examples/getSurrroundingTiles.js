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
const inputSize = document.getElementById("input-size");
const inputSizeToIncrease = document.getElementById("input-size-to-increase");
const inputIncludeMainObj = document.getElementById(
  "input-include-main-object"
);
const submitBtn = document.getElementById("btn-submit");

submitBtn.addEventListener("click", () => {
  const ID = Number(inputTileID.value);
  const size = inputSize.value ? Number(inputSize.value) : 1;
  const sizeToIncrease = inputSizeToIncrease.value
    ? Number(inputSizeToIncrease.value)
    : 1;

  const mainObj = {
    positionTile: IDToXY({ ID, nbChunksX }),
    size: { x: size, y: size },
    sizeToIncrease: { x: sizeToIncrease, y: sizeToIncrease },
    includeMainObject: inputIncludeMainObj.checked,
  };

  const range = getSurroundingTiles({
    ...mainObj,
    endX: nbChunksX - 1,
    endY: nbChunksX - 1,
  });

  showRange(range, mainObj);
});
