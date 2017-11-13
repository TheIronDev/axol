const targetCanvasEl = document.getElementById('targetCanvas');
const targetCtx = targetCanvasEl.getContext('2d');
const previewCanvasEl = document.getElementById('previewCanvas');
const previewCtx = previewCanvasEl.getContext('2d');
const layersEl = document.getElementById('layers');

const ActionEnum = {
  LINE: 'l',
  CIRCLE: 'c',
  RECTANGLE: 'r',
  UNKNOWN: 'u'
};

const ActionInputMap = {
  line: ActionEnum.LINE,
  circle: ActionEnum.CIRCLE,
  rectangle: ActionEnum.RECTANGLE,
};

/**
 * @typedef {{type: ActionEnum, params: Object}}
 */
let ActionEvent;

/**
 * Sets the current action
 * @param {string} actionInput
 */
function setAction(actionInput) {
  const action = ActionInputMap[actionInput] || ActionEnum.UNKNOWN;
  currentAction = action;
}

/**
 * Handles clearing a canvas context.
 * @param {!CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draws the canvas given an array of actions.
 * @param {!CanvasRenderingContext2D} ctx
 * @param {!Array<!ActionEvent>} actionHistory
 */
function drawCanvas(ctx, actionHistory) {
  clearCanvas(ctx);
  actionHistory.forEach(({type, params}) => {
    const {startX, startY, fillColor, lineColor} = params;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = lineColor;
    switch (type) {
      case ActionEnum.CIRCLE:
        const {radius} = params;
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
        break;
      case ActionEnum.LINE:
        const {endX, endY} = params;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.closePath();
        break;
      case ActionEnum.RECTANGLE:
        const {width, height} = params;
        ctx.fillRect(startX, startY, width, height);
        break;
      default:
    }
  });
}

/**
 * Updates the layers of actions
 * @param {!Array<!ActionEvent>} actionHistory
 */
function updateLayers(actionHistory) {
  while(layersEl.firstChild){
    layersEl.removeChild(layersEl.firstChild);
  }
  const docFrag = document.createDocumentFragment();
  actionHistory.forEach(({type, params}) => {
    const element = document.createElement('li');
    const paramString = Object.keys(params)
        .map((key) => `${key}:${params[key]}`)
        .join(' ');
    element.innerText = `${type}: ${paramString}`;
    docFrag.appendChild(element);
  });
  layersEl.appendChild(docFrag);
}

/**
 * Handles adding new action events to action events.
 * @param {!Array<!ActionEvent>} actionHistory
 * @param {number} offsetX
 * @param {number} offsetY
 */
function addActionEvent(actionHistory, offsetX, offsetY) {
  const params = {
    fillColor: currentActionFillColor,
    lineColor: currentActionLineColor,
    startX: startOffsetX,
    startY: startOffsetY
  };
  let type;

  switch (currentAction) {
    case ActionEnum.CIRCLE:
      const radius = Math.sqrt(
          (offsetY - startOffsetY) ** 2 + (offsetX - startOffsetX) ** 2);
      Object.assign(params, {radius});
      type = ActionEnum.CIRCLE;
      break;
    case ActionEnum.LINE:
      Object.assign(params, {endX: offsetX, endY: offsetY});
      type = ActionEnum.LINE;
      break;
    case ActionEnum.RECTANGLE:
      const width = offsetX - startOffsetX;
      const height = offsetY - startOffsetY;
      Object.assign(params, {height, width});
      type = ActionEnum.RECTANGLE;
      break;
    default:
  }

  if (!type) {
    return;
  }
  actionHistory.push({type, params});
}

/**
 * @type {!Array<!ActionEvent>}
 */
let currentActionHistory = [];
let previewActionHistory = [];
let currentAction = ActionEnum.RECTANGLE;
let currentActionFillColor = '#000';
let currentActionLineColor = '#000';
let isPerformingAction = false;
let startOffsetX;
let startOffsetY;


/**
 * Handles `mousedown` events on the canvas. This will generally only be used to
 * track the starting x and y offsets.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseDown(ev) {
  const {offsetX, offsetY} = ev;
  switch (currentAction) {
    case ActionEnum.CIRCLE:
    case ActionEnum.RECTANGLE:
    case ActionEnum.LINE:
      startOffsetX = offsetX;
      startOffsetY = offsetY;
      break;
    default:
  }
  isPerformingAction = true;
}

/**
 * Handles `mousemove` events on the canvas.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseMove(ev) {
  if (!isPerformingAction) {
    return;
  }
  requestAnimationFrame(() => {
    const {offsetX, offsetY} = ev;
    previewActionHistory = [];
    addActionEvent(previewActionHistory, offsetX, offsetY);
    drawCanvas(previewCtx, previewActionHistory);
  });
}

/**
 * Handles `mouseup` events on the canvas.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseUp(ev) {
  const {offsetX, offsetY} = ev;
  addActionEvent(currentActionHistory, offsetX, offsetY);

  clearCanvas(previewCtx);
  drawCanvas(targetCtx, currentActionHistory);
  updateLayers(currentActionHistory);
  isPerformingAction = false;
}

targetCanvasEl.addEventListener('mousedown', onCanvasMouseDown);
targetCanvasEl.addEventListener('mousemove', onCanvasMouseMove);
targetCanvasEl.addEventListener('mouseup', onCanvasMouseUp);

document.querySelector('.actions').addEventListener('change', (ev) => {
  setAction(ev.target.value)
});

document.querySelector('#actionFillColor').addEventListener('change', (ev) => {
  currentActionFillColor = ev.target.value;
});

document.querySelector('#actionLineColor').addEventListener('change', (ev) => {
  currentActionLineColor = ev.target.value;
});
