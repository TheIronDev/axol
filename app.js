const canvasEl = document.getElementById('canvas');
const layersEl = document.getElementById('layers');
const ctx = canvasEl.getContext('2d');

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
 * Draws the canvas given an array of actions.
 * @param {!CanvasRenderingContext2D} ctx
 * @param {!Array<!ActionEvent>} actionHistory
 */
function drawCanvas(ctx, actionHistory) {
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

function addActionEvent(actionHistory, type, params) {
  actionHistory.push({type, params});
}

/**
 * @type {!Array<!ActionEvent>}
 */
let currentActionHistory = [];
let currentAction = ActionEnum.RECTANGLE;
let currentActionFillColor = '#000';
let currentActionLineColor = '#000';
let startOffsetX;
let startOffsetY;


/**
 * Handles mousedown events on the canvas. This will generally only be used to
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
}

/**
 * Handles mouseup events on the canvas.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseUp(ev) {
  const {offsetX, offsetY} = ev;
  const params = {
    fillColor: currentActionFillColor,
    lineColor: currentActionLineColor,
    startX: startOffsetX,
    startY: startOffsetY
  };
  switch (currentAction) {
    case ActionEnum.CIRCLE:
      const radius = Math.sqrt(
          (offsetY - startOffsetY) ** 2 + (offsetX - startOffsetX) ** 2);
      addActionEvent(
          currentActionHistory,
          ActionEnum.CIRCLE,
          Object.assign(params, {radius}));
      break;
    case ActionEnum.LINE:
      addActionEvent(
          currentActionHistory,
          ActionEnum.LINE,
          Object.assign(params, {endX: offsetX, endY: offsetY}));
      break;
    case ActionEnum.RECTANGLE:
      const width = offsetX - startOffsetX;
      const height = offsetY - startOffsetY;
      addActionEvent(
          currentActionHistory,
          ActionEnum.RECTANGLE,
          Object.assign(params, {height, width}));
      break;
    default:
  }
  drawCanvas(ctx, currentActionHistory);
  updateLayers(currentActionHistory);
}

canvasEl.addEventListener('mousedown', onCanvasMouseDown);
canvasEl.addEventListener('mouseup', onCanvasMouseUp);

document.querySelector('.actions').addEventListener('change', (ev) => {
  setAction(ev.target.value)
});

document.querySelector('#actionFillColor').addEventListener('change', (ev) => {
  currentActionFillColor = ev.target.value;
});

document.querySelector('#actionLineColor').addEventListener('change', (ev) => {
  currentActionLineColor = ev.target.value;
});
