const targetCanvasEl = document.getElementById('targetCanvas');
const targetCtx = targetCanvasEl.getContext('2d');
const previewCanvasEl = document.getElementById('previewCanvas');
const previewCtx = previewCanvasEl.getContext('2d');
const layersEl = document.getElementById('layers');

const ActionEnum = {
  LINE: 'l',
  MOVE: 'm',
  CIRCLE: 'c',
  RECTANGLE: 'r',
  UNKNOWN: 'u'
};

const LayerActionEnums = {
  DELETE: 'd',
  SELECT: 's'
};

const ActionInputMap = {
  line: ActionEnum.LINE,
  move: ActionEnum.MOVE,
  circle: ActionEnum.CIRCLE,
  rectangle: ActionEnum.RECTANGLE,
};

/**
 * @typedef {{type: ActionEnum, id: number, startX: number, startY: number}}
 */
let ActionEvent;


/**
 * @type {!Array<!ActionEvent>}
 */
let currentActionHistory = [];
let previewActionHistory = [];
let currentAction = ActionEnum.RECTANGLE;
let currentActionFillColor = '#000';
let currentActionLineColor = '#000';
let currentLayerActionEvent;
let currentLayerId = 0;
let isPerformingAction = false;
let startOffsetX;
let startOffsetY;

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
 * @param {boolean} isHighlight
 */
function drawCanvas(ctx, actionHistory) {
  clearCanvas(ctx);
  actionHistory.forEach((params) => {
    const {fillColor, lineColor, startX, startY, type} = params;
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
 * @param {!ActionEvent} actionEvent
 */
function addLayer(actionEvent) {
  const {id, type} = actionEvent;
  const layerId = `action-${id}`;

  const li = document.createElement('li');
  li.classList.add('layer');
  li.id = layerId;
  li.setAttribute('data-id', id);

  const close = document.createElement('i');
  close.classList.add('material-icons');
  close.classList.add('closeLayer');
  close.innerText = 'delete';
  close.setAttribute('data-id', id);
  close.setAttribute('data-action', LayerActionEnums.DELETE);

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'currentLayer';
  radio.value = id;
  radio.setAttribute('data-id', id);
  radio.checked = true;
  radio.setAttribute('data-action', LayerActionEnums.SELECT);

  const description = document.createElement('span');
  description.name = 'currentLayer';

  const paramString = Object.keys(actionEvent)
      .map((key) => `${key}:${actionEvent[key]}`)
      .join(' ');
  description.innerText = `${type}: ${paramString}`;

  li.appendChild(radio);
  li.appendChild(close);
  li.appendChild(description);

  layersEl.insertBefore(li, layersEl.firstChild);
  currentLayerActionEvent = getCurrentActionEvent(id);
}

/**
 * @param {number} id
 */
function removeLayer (id) {
  const layer = document.getElementById(`action-${id}`);
  const selectQuery = `[data-action="${LayerActionEnums.SELECT}"]`;
  let selectedRadio;
  if (layer) {
    if (layer.previousSibling) {
      selectedRadio = layer.previousSibling.querySelector(selectQuery);
    } else if (layer.nextSibling) {
      selectedRadio = layer.nextSibling.querySelector(selectQuery);
    }
    if (selectedRadio) {
      const id = parseInt(selectedRadio.value, 10);
      selectedRadio.checked = true;
      currentLayerActionEvent = getCurrentActionEvent(id);
    }
    layer.parentNode.removeChild(layer);
  }
}

function addCurrentActionEvent(actionEvent) {
  currentActionHistory.push(actionEvent);
}

function addPreviewActionEvent(actionEvent) {
  previewActionHistory.push(actionEvent);
}

function removeCurrentActionEvent(id) {
  currentActionHistory = currentActionHistory
      .filter((actionEvent) => id !== actionEvent.id);
}

function getCurrentActionEvent(id) {
  return currentActionHistory.find((actionEvent) => id === actionEvent.id);
}

/**
 * Returns new action events.
 * @param {number} offsetX
 * @param {number} offsetY
 * @return {?ActionEvent}
 */
function getActionEvent(offsetX, offsetY) {
  const params = {
    fillColor: currentActionFillColor,
    id: null,
    lineColor: currentActionLineColor,
    startX: startOffsetX,
    startY: startOffsetY
  };
  let type;

  switch (currentAction) {
    case ActionEnum.CIRCLE:
      const radius = Math.sqrt(
          (offsetY - startOffsetY) ** 2 + (offsetX - startOffsetX) ** 2);
      type = ActionEnum.CIRCLE;
      Object.assign(params, {radius, type});
      break;
    case ActionEnum.LINE:
      type = ActionEnum.LINE;
      Object.assign(params, {endX: offsetX, endY: offsetY, type});
      break;
    case ActionEnum.RECTANGLE:
      const width = offsetX - startOffsetX;
      const height = offsetY - startOffsetY;
      type = ActionEnum.RECTANGLE;
      Object.assign(params, {height, type, width});
      break;
    default:
  }

  if (!type) {
    return null;
  }
  return /** @type {!ActionEvent} */ params;
}

/**
 * Handles `mousedown` events on the canvas. This will generally only be used to
 * track the starting x and y offsets.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseDown(ev) {
  const {offsetX, offsetY} = ev;
  isPerformingAction = true;

  switch (currentAction) {
    case ActionEnum.CIRCLE:
    case ActionEnum.RECTANGLE:
    case ActionEnum.LINE:
    case ActionEnum.MOVE:
      startOffsetX = offsetX;
      startOffsetY = offsetY;
      break;
    default:
      return new Error('ActionEnum not handled in mousedown');
  }
}

/**
 * Handles `mousemove` events on the canvas.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseMove(ev) {
  if (!isPerformingAction) {
    return;
  }
  const {offsetX, offsetY} = ev;
  let actionEvent;

  switch (currentAction) {
    case ActionEnum.CIRCLE:
    case ActionEnum.RECTANGLE:
    case ActionEnum.LINE:
      actionEvent = getActionEvent(offsetX, offsetY);
      break;
    case ActionEnum.MOVE:
      const xOffset = offsetX - startOffsetX;
      const yOffset = offsetY - startOffsetY;
      const startX = currentLayerActionEvent.startX + xOffset;
      const startY = currentLayerActionEvent.startY + yOffset;
      actionEvent =
          Object.assign({}, currentLayerActionEvent, {startX, startY});
      break;
    default:
      return new Error('ActionEnum not handled in mousemove');
  }

  previewActionHistory = [actionEvent];
  drawCanvas(previewCtx, previewActionHistory);
}

/**
 * Handles `mouseup` events on the canvas.
 * @param {!MouseEvent} ev
 */
function onCanvasMouseUp(ev) {
  const {offsetX, offsetY} = ev;
  isPerformingAction = false;

  switch (currentAction) {
    case ActionEnum.CIRCLE:
    case ActionEnum.RECTANGLE:
    case ActionEnum.LINE:
      const actionEvent = getActionEvent(offsetX, offsetY);

      if (!actionEvent) {
        return;
      }

      actionEvent.id = ++currentLayerId;
      currentActionHistory.push(actionEvent);
      addLayer(/** @type {!ActionEvent} */ actionEvent);
      break;
    case ActionEnum.MOVE:
      const xOffset = offsetX - startOffsetX;
      const yOffset = offsetY - startOffsetY;
      const startX = currentLayerActionEvent.startX + xOffset;
      const startY = currentLayerActionEvent.startY + yOffset;

      // Update the existing ActionEvent
      Object.assign(currentLayerActionEvent, {startX, startY});
      // TODO: Update layer
      break;
    default:
  }

  clearCanvas(previewCtx);
  drawCanvas(targetCtx, currentActionHistory);
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

layersEl.addEventListener('change', (ev) => {
  const id = parseInt(ev.target.value, 10);
  currentLayerActionEvent = getCurrentActionEvent(id);
}, true);

layersEl.addEventListener('click', (ev) => {
  const dataset = ev.target.dataset || {};
  const id = parseInt(dataset.id, 10);
  const action = dataset.action;

  if (!id) {
    return;
  }

  switch (action) {
    case LayerActionEnums.DELETE:
      removeLayer(id);
      removeCurrentActionEvent(id);
      break;
    case LayerActionEnums.SELECT:
      break;
    default:
  }

  clearCanvas(previewCtx);
  drawCanvas(targetCtx, currentActionHistory);
}, true);

layersEl.addEventListener('mousemove', (ev) => {
  const id = parseInt(ev.target.dataset.id, 10);
  const actionEvent = getCurrentActionEvent(id);
  if (!actionEvent) {
    return;
  }

  const previewEvent = Object.assign(
      {},
      actionEvent,
      {fillColor: '#f00', lineColor: '#f00'});
  previewActionHistory = [previewEvent];
  drawCanvas(previewCtx, previewActionHistory);
}, true);

layersEl.addEventListener('mouseleave', () => {
  clearCanvas(previewCtx);
}, true);
