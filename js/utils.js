export const IDToXY = ({ ID, nbChunksX }) => ({
  x: ID % nbChunksX,
  y: Math.floor(ID / nbChunksX),
});

export const getObjectTiles = ({ positionTile, size = { x: 1, y: 1 } }) => {
  if (size.x <= 0 || size.y <= 0) {
    return [];
  }

  const { x, y } = positionTile;

  const objectTiles = [];

  for (let xi = x; xi < x + size.x; xi += 1) {
    for (let yj = y; yj < y + size.y; yj += 1) {
      objectTiles.push({ x: xi, y: yj });
    }
  }

  return objectTiles;
};

export const getSurroundingTiles = ({
  positionTile,
  size = { x: 1, y: 1 },
  sizeToIncrease = { x: 1, y: 1 },
  startX = 0,
  startY = 0,
  endX = 4,
  endY = 4,
  includeMainObject = false,
}) => {
  const { x, y } = positionTile;

  if (x < 0 || y < 0) {
    return [];
  }

  let objectTiles = [];

  if (!includeMainObject) {
    objectTiles = getObjectTiles({ positionTile, size });

    if (objectTiles.length === 0) {
      return [];
    }
  }

  const tiles = [];

  for (
    let xi = x - sizeToIncrease.x;
    xi < x + size.x + sizeToIncrease.x;
    xi += 1
  ) {
    for (
      let yj = y - sizeToIncrease.y;
      yj < y + size.y + sizeToIncrease.y;
      yj += 1
    ) {
      if (
        xi >= startX &&
        xi <= endX &&
        yj >= startY &&
        yj <= endY &&
        !objectTiles.some(
          (objectTile) => xi === objectTile.x && yj === objectTile.y
        )
      ) {
        tiles.push({ x: xi, y: yj });
      }
    }
  }

  return tiles;
};
