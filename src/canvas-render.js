import CanvasActionEnum from './const/canvas-action-enum';

/**
 * Handles clearing a canvas context.
 * @param {!CanvasRenderingContext2D} ctx
 */
export const clearCanvas = (ctx) => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
};

/**
 * Returns the center of a canvasItem
 * @param {!CanvasItem} canvasItem
 * @return {{centerX: number, centerY: number}}
 */
export const getCanvasItemCenter = (canvasItem) => {
  const {startX, startY, type} = canvasItem;
  let centerX;
  let centerY;
  switch (type) {
    case CanvasActionEnum.BRUSH:
    case CanvasActionEnum.POLYGON:
      const {path} = canvasItem;
      const edges = path.reduce((memo, point) => {
        const {leftEdge, topEdge, rightEdge, bottomEdge} = memo;
        if (leftEdge === null || point.x < leftEdge) {
          memo.leftEdge = point.x;
        }

        if (rightEdge === null || point.x > rightEdge) {
          memo.rightEdge = point.x;
        }

        if (topEdge === null || point.y < topEdge) {
          memo.topEdge = point.y;
        }

        if (bottomEdge === null || point.y > bottomEdge) {
          memo.bottomEdge = point.y;
        }

        return memo;
      }, {leftEdge: null, topEdge: null, rightEdge: null, bottomEdge: null});
      centerX = startX + (edges.leftEdge + edges.rightEdge) / 2;
      centerY = startY + (edges.topEdge + edges.bottomEdge) / 2;
      break;
    case CanvasActionEnum.LINE:
      const {xOffset, yOffset} = canvasItem;

      centerX = startX + (xOffset / 2);
      centerY = startY + (yOffset / 2);
      break;
    case CanvasActionEnum.RECTANGLE:
      const {width, height} = canvasItem;
      centerX = startX + (width / 2);
      centerY = startY + (height / 2);
      break;
    default:
      centerX = startX;
      centerY = startY;
  }
  return {centerX, centerY};
};

/**
 * Renders a canvasItem onto a canvas context.
 * @param {!CanvasRenderingContext2D} ctx
 * @param {!CanvasItem} canvasItem
 * @param {number} centerX
 * @param {number} centerY
 */
export const renderCanvasItem = (ctx, canvasItem, centerX, centerY) => {
  const {startX, startY, type, rotate} = canvasItem;
  let x;
  let y;

  // Rotate the canvas pivoted on the center of the canvasItem.
  ctx.translate(centerX, centerY);
  ctx.rotate(rotate * Math.PI / 180);

  // Begin drawing a canvasItem
  ctx.beginPath();

  // Depending on the canvasItem type, we draw shapes differently.
  switch (type) {
    case CanvasActionEnum.BRUSH:
      x = -centerX + startX;
      y = -centerY + startY;
      canvasItem.path.forEach((point) => {
        ctx.lineTo(x + point.x, y + point.y);
      });
      ctx.stroke();
      break;
    case CanvasActionEnum.CIRCLE:
      const {radius} = canvasItem;
      ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
      ctx.fill();
      ctx.stroke();
      break;
    case CanvasActionEnum.LINE:
      const {xOffset, yOffset} = canvasItem;
      ctx.moveTo(-xOffset / 2, -yOffset / 2);
      ctx.lineTo(xOffset / 2, yOffset / 2);
      ctx.stroke();
      break;
    case CanvasActionEnum.POLYGON:
      x = -centerX + startX;
      y = -centerY + startY;
      canvasItem.path.forEach((point) => {
        ctx.lineTo(x + point.x, y + point.y);
      });
      ctx.fill();
      ctx.stroke();
      break;
    case CanvasActionEnum.RECTANGLE:
      const {width, height} = canvasItem;
      ctx.fillRect(-width / 2, -height/2, width, height);
      ctx.strokeRect(-width / 2, -height/2, width, height);
      break;
    default:
  }

  // Always close the path.
  ctx.closePath();

  // Return the canvas back the original state before we were drawing the
  // canvasItem.
  ctx.rotate(-rotate * Math.PI / 180);
  ctx.translate(-centerX, -centerY);
};

/**
 * Handles calling the appropriate methods needed to draw a canvasItem. This
 * acts as a high order function, being passed in a canvas context and
 * returning a method that will handle any given canvasItem.
 * @param {!CanvasRenderingContext2D} ctx
 * @return {function(*=)}
 */
export const canvasItemRenderer = (ctx) => {
  return (canvasItem) => {
    if (!canvasItem) {
      return;
    }

    const {fillColor, lineColor, lineWidth} = canvasItem;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    // Retrieve the center of the canvasItem, used for centering.
    const {centerX, centerY} = getCanvasItemCenter(canvasItem);

    // Render the canvasItem
    renderCanvasItem(ctx, canvasItem, centerX, centerY);
  };
};

/**
 * Draws the canvas given an array of canvasItems.
 * @param {!CanvasRenderingContext2D} ctx
 * @param {!Array<!CanvasItem>} canvasItemList
 */
export const drawCanvas = (ctx, canvasItemList) => {
  clearCanvas(ctx);
  canvasItemList.forEach(canvasItemRenderer(ctx));
};
