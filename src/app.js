import Rx from 'rxjs/Rx';
import CanvasActionEnum from './const/canvas-action-enum';
import LayerCanvasActionEnums from './const/layer-action-enum';
import ActionShapeIcon from './const/action-shape-icon';
import ActionInputMap from './const/action-input-map';

import {addCanvasItem, removeCanvasItem, setPreviewCanvasItem, unsetPreviewCanvasItem} from "./actions/actions";
import {store$} from './store';

// For now, I'm just console logging the dispatched state changes.
store$.subscribe(console.log);

const targetCanvasEl = document.getElementById('targetCanvas');
const targetCtx = targetCanvasEl.getContext('2d');
const previewCanvasEl = document.getElementById('previewCanvas');
const previewCtx = previewCanvasEl.getContext('2d');
const layersEl = document.getElementById('layers');

/**
 * @typedef {{type: CanvasActionEnum, id: number, startX: number, startY: number}}
 */
let CanvasItem;

/**
 * @type {!Array<!CanvasItem>}
 */
let currentCanvasItemList = [];
let previewCanvasItemList = [];
let currentAction = CanvasActionEnum.RECTANGLE;
let currentActionFillColor = '#000';
let currentActionLineColor = '#000';
let selectedCanvasItem;

/**
 * Sets the current action
 * @param {string} actionInput
 */
function setAction(actionInput) {
  const action = ActionInputMap[actionInput] || CanvasActionEnum.UNKNOWN;
  currentAction = action;
}

/**
 * Handles clearing a canvas context. This is really just a helper method.
 * @param {!CanvasRenderingContext2D} ctx
 */
function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

/**
 * Draws the canvas given an array of canvasItems.
 * @param {!CanvasRenderingContext2D} ctx
 * @param {!Array<!CanvasItem>} canvasItemList
 */
function drawCanvas(ctx, canvasItemList) {
  clearCanvas(ctx);
  canvasItemList.forEach((params) => {
    const {fillColor, lineColor, startX, startY, type} = params;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = lineColor;
    switch (type) {
      case CanvasActionEnum.CIRCLE:
        const {radius} = params;
        ctx.beginPath();
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        ctx.closePath();
        break;
      case CanvasActionEnum.LINE:
        const {xOffset, yOffset} = params;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + xOffset, startY + yOffset);
        ctx.stroke();
        ctx.closePath();
        break;
      case CanvasActionEnum.RECTANGLE:
        const {width, height} = params;
        ctx.fillRect(startX, startY, width, height);
        break;
      default:
    }
  });
}

/**
 * Updates the layers of actions
 * @param {!CanvasItem} canvasItem
 */
function addLayer(canvasItem) {
  const {id, type, fillColor, lineColor} = canvasItem;
  const layerId = `action-${id}`;

  const li = document.createElement('li');
  li.classList.add('layer');
  li.id = layerId;
  li.setAttribute('data-id', '' + id);

  const close = document.createElement('i');
  close.classList.add('material-icons');
  close.classList.add('closeLayer');
  close.innerText = 'delete';
  close.setAttribute('data-id', '' + id);
  close.setAttribute('data-action', LayerCanvasActionEnums.DELETE);

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'currentLayer';
  radio.value = id;
  radio.setAttribute('data-id', '' + id);
  radio.checked = true;
  radio.setAttribute('data-action', LayerCanvasActionEnums.SELECT);

  const fillColorInput = document.createElement('input');
  fillColorInput.type = 'color';
  fillColorInput.value = fillColor;
  fillColorInput.setAttribute('data-id', '' + id);
  fillColorInput
      .setAttribute('data-action', LayerCanvasActionEnums.CHANGE_FILL_COLOR);

  const lineColorInput = document.createElement('input');
  lineColorInput.type = 'color';
  lineColorInput.value = lineColor;
  lineColorInput.setAttribute('data-id', '' + id);
  lineColorInput
      .setAttribute('data-action', LayerCanvasActionEnums.CHANGE_LINE_COLOR);

  const shape = document.createElement('i');
  shape.classList.add('material-icons');
  shape.classList.add('layerShape');
  shape.innerText = ActionShapeIcon[type] || '';

  li.appendChild(radio);
  li.appendChild(close);
  li.appendChild(shape);
  li.appendChild(fillColorInput);
  li.appendChild(lineColorInput);

  layersEl.insertBefore(li, layersEl.firstChild);
  selectedCanvasItem = getCurrentCanvasItem(id);
}

/**
 * @param {number} id
 */
function removeLayer (id) {
  const layer = document.getElementById(`action-${id}`);
  const selectQuery = `[data-action="${LayerCanvasActionEnums.SELECT}"]`;
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
      selectedCanvasItem = getCurrentCanvasItem(id);
    }
    layer.parentNode.removeChild(layer);
  }
}

/**
 * @param {!CanvasItem} canvasItem
 */
function addNewCanvasItem(canvasItem) {
  currentCanvasItemList.push(canvasItem);
  addLayer(/** @type {!CanvasItem} */ canvasItem);
  addCanvasItem(canvasItem);
}

/**
 * @param {number} id
 */
function removeCurrentCanvasItem(id) {
  currentCanvasItemList = currentCanvasItemList
      .filter((canvasItem) => id !== canvasItem.id);
  removeLayer(id);
}

/**
 *
 * @param {number} id
 * @returns {?CanvasItem}
 */
function getCurrentCanvasItem(id) {
  return currentCanvasItemList.find((canvasItem) => id === canvasItem.id);
}

/**
 * Returns new canvasItem from recorded mousedown and mousemove/up states.
 * @param {{startX: number, startY: number, endX: number, endY: number}} state
 * @return {?CanvasItem}
 */
function createNewCanvasItem(state) {
  const {startX, startY, endX, endY, id} = state;
  const params = {
    fillColor: currentActionFillColor,
    id,
    lineColor: currentActionLineColor,
    startX,
    startY
  };
  let type;

  switch (currentAction) {
    case CanvasActionEnum.CIRCLE:
      const radius = Math.sqrt(
          (endY - startY) ** 2 + (endX - startX) ** 2);
      type = CanvasActionEnum.CIRCLE;
      Object.assign(params, {radius, type});
      break;
    case CanvasActionEnum.LINE:
      type = CanvasActionEnum.LINE;
      const xOffset = endX - startX;
      const yOffset = endY - startY;
      Object.assign(params, {xOffset, yOffset, type});
      break;
    case CanvasActionEnum.RECTANGLE:
      const width = endX - startX;
      const height = endY - startY;
      type = CanvasActionEnum.RECTANGLE;
      Object.assign(params, {height, type, width});
      break;
    default:
  }

  if (!type) {
    return null;
  }
  return /** @type {!CanvasItem} */ params;
}

/**
 * @param {{startX: number, startY: number, endX: number, endY: number}} state
 * @return {?CanvasItem}
 */
function getCanvasItem(state) {
  const {startX, startY, endX, endY} = state;
  let canvasItem;

  switch (currentAction) {
    case CanvasActionEnum.CIRCLE:
    case CanvasActionEnum.RECTANGLE:
    case CanvasActionEnum.LINE:
      canvasItem = createNewCanvasItem(state);
      break;
    case CanvasActionEnum.MOVE:
      if (!selectedCanvasItem) {
        return null;
      }
      const xOffset = endX - startX;
      const yOffset = endY - startY;
      const newStartX = selectedCanvasItem.startX + xOffset;
      const newStartY = selectedCanvasItem.startY + yOffset;
      const update = {startX: newStartX, startY: newStartY};

      canvasItem = Object.assign({}, selectedCanvasItem, update);
      break;
    default:
      throw new Error('CanvasActionEnum not handled in mousemove');
  }

  return canvasItem;
}

/**
 * Renders a preview of a canvas item.
 */
function renderCanvasItemPreview(canvasItem) {
  if (!canvasItem) {
    clearCanvas(previewCtx);
    return;
  }
  previewCanvasItemList = [canvasItem];
  drawCanvas(previewCtx, previewCanvasItemList);
}

/**
 */
function addOrUpdateCanvasItem(canvasItem) {
  if (!canvasItem) {
    return;
  }
  let newCanvasItem;
  switch (currentAction) {
    case CanvasActionEnum.CIRCLE:
    case CanvasActionEnum.RECTANGLE:
    case CanvasActionEnum.LINE:
      addNewCanvasItem(canvasItem);
      break;
    case CanvasActionEnum.MOVE:
      if (!selectedCanvasItem) {
        return;
      }
      // Mutate the original selectedCanvasItem with our newer canvasItem.
      Object.assign(selectedCanvasItem, canvasItem);
      break;
    default:
  }
}

function renderCurrentCanvasItemList() {
  clearCanvas(previewCtx);
  drawCanvas(targetCtx, currentCanvasItemList);
}


const targetCanvasMousedown$ = Rx.Observable.fromEvent(targetCanvasEl, 'mousedown');

const docMouseMove$ =Rx.Observable.fromEvent(document, 'mousemove');

const docMouseUp$ = Rx.Observable.fromEvent(document, 'mouseup');

/**
 * Handles drawing a canvas by observing a mousedown, followed by mousemoves,
 * which will get recorded until mouseup. Essentially its drag-and-drop.
 */
const canvasDraw$ = targetCanvasMousedown$
    .map((ev) => {
      const {offsetX, offsetY} = ev;
      return {startX: offsetX, startY: offsetY};
    })
    .scan((memo, state) => {
      // Generate a new id that may or may not be used, we just want a
      // semblance of uniqueness.
      return Object.assign({}, state, {id: memo.id + 1});
    }, {id: 0})
    .switchMap(({startX, startY, id}) => {
      return docMouseMove$
          // Map the mousemove event to a simple object
          .map((ev) => {
            const {offsetX: endX, offsetY: endY} = ev;
            return {endX, endY, startX, startY, id};
          })
          // Map the object returned from earlier into a "CanvasItem"
          .map(getCanvasItem)
          .do(setPreviewCanvasItem)

          // Render the preview canvas
          .do(renderCanvasItemPreview)
          .takeUntil(
              docMouseUp$
                  .map((ev) => {
                    const {offsetX: endX, offsetY: endY} = ev;
                    return {endX, endY, startX, startY, id};
                  })
                  .map(getCanvasItem)
                  // Render the primary canvas
                  .do(addOrUpdateCanvasItem)
                  .do(unsetPreviewCanvasItem)
                  .do(renderCurrentCanvasItemList)
          );
    });

// We won't see any canvas drawing unless we subscribe to the observable.
canvasDraw$.subscribe();

document.querySelectorAll('.actions').forEach((action) => {
  action.addEventListener('change', (ev) => setAction(ev.target.value));
});

document.querySelector('#actionFillColor').addEventListener('change', (ev) => {
  currentActionFillColor = ev.target.value;
});

document.querySelector('#actionLineColor').addEventListener('change', (ev) => {
  currentActionLineColor = ev.target.value;
});

layersEl.addEventListener('change', (ev) => {
  const {target} = ev;
  const dataset = target.dataset || {};
  const id = parseInt(dataset.id, 10);
  const action = dataset.action;

  selectedCanvasItem = getCurrentCanvasItem(id);

  switch (action) {
    case LayerCanvasActionEnums.CHANGE_FILL_COLOR:
      selectedCanvasItem.fillColor = target.value;
      break;
    case LayerCanvasActionEnums.CHANGE_LINE_COLOR:
      selectedCanvasItem.lineColor = target.value;
      break;
    case LayerCanvasActionEnums.SELECT:
      break;
    default:
  }

  renderCurrentCanvasItemList();
}, true);

layersEl.addEventListener('click', (ev) => {
  const dataset = ev.target.dataset || {};
  const id = parseInt(dataset.id, 10);
  const action = dataset.action;

  if (!id) {
    return;
  }

  switch (action) {
    case LayerCanvasActionEnums.DELETE:
      removeCurrentCanvasItem(id);
      removeCanvasItem(id);
      break;
    case LayerCanvasActionEnums.SELECT:
      break;
    default:
  }

  renderCurrentCanvasItemList();
}, true);

layersEl.addEventListener('mousemove', (ev) => {
  const id = parseInt(ev.target.dataset.id, 10);
  const canvasItem = getCurrentCanvasItem(id);
  const previewCanvasItem = Object.assign(
      {},
      canvasItem,
      {fillColor: '#f00', lineColor: '#f00'});
  previewCanvasItemList = [previewCanvasItem];
  drawCanvas(previewCtx, previewCanvasItemList);
}, true);

layersEl.addEventListener('mouseleave', () => clearCanvas(previewCtx), true);
