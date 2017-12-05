import {Observable} from 'rxjs/Rx';
import CanvasActionEnums from './const/canvas-action-enum';
import LayerCanvasActionEnums from './const/layer-action-enum';
import ActionShapeIcon from './const/action-shape-icon';
import {clearCanvas, drawCanvas} from './canvas-render';

import {
  addOrModifyCanvasItem,
  highlightCanvasItem,
  modifyCanvasItem,
  copyCanvasItem,
  removeCanvasItem,
  removeSelectedCanvasItem,
  setPreviewCanvasItem,
  setSelectedCanvasItem,
  unsetPreviewCanvasItem,
  updateCurrentAction,
  updateCurrentActionFromInput,
  updateCurrentActionFill,
  updateCurrentActionLine,
  updateCurrentActionLineWidth,
} from './actions/actions';
import {store$} from './store';


const targetCanvasEl = document.getElementById('targetCanvas');
const targetCtx = targetCanvasEl.getContext('2d');
const previewCanvasEl = document.getElementById('previewCanvas');
const previewCtx = previewCanvasEl.getContext('2d');
const layersEl = document.getElementById('layers');

store$.subscribe((state) => {
  clearCanvas(previewCtx);
  clearCanvas(targetCtx);
  drawCanvas(previewCtx, state.previewCanvasItemList);
  drawCanvas(targetCtx, state.currentCanvasItemList);
  renderLayers(state.currentCanvasItemList, state.selectedCanvasItemId);
  updateSelectedAction(state.currentAction);
});

/**
 * @typedef CanvasItem
 * @type {Object}
 * @property {CanvasActionEnum} type
 * @property {number} id
 * @property {number} startX
 * @property {number} startY
 */

/**
 * Updates the layers of actions
 * @param {!CanvasItem} canvasItem
 * @return {!Element}
 */
function createLayer(canvasItem) {
  const {id, type, fillColor, lineColor} = canvasItem;
  const layerId = `action-${id}`;

  const li = document.createElement('li');
  li.classList.add('layer');
  li.id = layerId;
  li.setAttribute('data-id', '' + id);

  const close = document.createElement('i');
  close.classList.add('material-icons');
  close.classList.add('layerAction');
  close.innerText = 'delete';
  close.setAttribute('data-id', '' + id);
  close.setAttribute('data-action', LayerCanvasActionEnums.DELETE);

  const copy = document.createElement('i');
  copy.classList.add('material-icons');
  copy.classList.add('layerAction');
  copy.innerText = 'content_copy';
  copy.setAttribute('data-id', '' + id);
  copy.setAttribute('data-action', LayerCanvasActionEnums.COPY);

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'currentLayer';
  radio.value = id;
  radio.id = `selected-${id}`;
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
  li.appendChild(copy);
  li.appendChild(close);
  li.appendChild(shape);
  li.appendChild(fillColorInput);
  li.appendChild(lineColorInput);
  return li;
}

/**
 *
 * @param {!Array<!CanvasItem>} canvasItemList
 * @param {number} selectedCanvasItemId
 */
function renderLayers(canvasItemList, selectedCanvasItemId) {
  // Add canvasItem layers if they don't already exist.
  canvasItemList.forEach((canvasItem) => {
    if (!document.getElementById(`action-${canvasItem.id}`)) {
      const newLayer = createLayer(canvasItem);
      if (layersEl.firstElementChild) {
        layersEl.insertBefore(newLayer, layersEl.firstElementChild);
      } else {
        layersEl.appendChild(newLayer);
      }
    }
  });

  // Gather a list of the ids
  const ids = canvasItemList.reduce((memo, {id}) => {
    memo[id] = true;
    return memo;
  }, {});

  // Remove layers that are no longer in the list.
  let child = layersEl.firstElementChild;
  let nextChild;
  while (child) {
    nextChild = child.nextSibling;
    if (!ids[child.dataset.id]) {
      child.parentNode.removeChild(child);
    }
    child = nextChild;
  }

  // Set value of the selected canvas item (in case it was deleted.)
  const selected = document.getElementById(`selected-${selectedCanvasItemId}`);
  if (selected) {
    selected.checked = true;
  }
}

/**
 * Handles updating the selected canvas action.
 * @param {!CanvasActionEnums} currentAction
 */
function updateSelectedAction(currentAction) {
  let selectedInput;
  switch (currentAction) {
    case CanvasActionEnums.BRUSH:
      selectedInput = document.getElementById('action-brush');
      break;
    case CanvasActionEnums.LINE:
      selectedInput = document.getElementById('action-line');
      break;
    case CanvasActionEnums.MOVE:
      selectedInput = document.getElementById('action-move');
      break;
    case CanvasActionEnums.CIRCLE:
      selectedInput = document.getElementById('action-circle');
      break;
    case CanvasActionEnums.RECTANGLE:
      selectedInput = document.getElementById('action-rectangle');
      break;
    case CanvasActionEnums.ROTATE:
      selectedInput = document.getElementById('action-rotate');
      break;
    default:
  }
  if (!selectedInput) {
    return;
  }
  selectedInput.checked = true;
}

const targetCanvasMousedown$ = Observable.fromEvent(targetCanvasEl, 'mousedown')
    .map((ev) => {
      const {offsetX: startX, offsetY: startY} = ev;
      return {startX, startY};
    });
const targetCanvastouchStart$ = Observable
    .fromEvent(targetCanvasEl, 'touchstart')
    .map((ev) => {
      const {touches} = ev;
      const {target} = touches[0];
      const {x, y} = target.getBoundingClientRect();
      let startX = touches[0].clientX - x;
      let startY = touches[0].clientY - y;
      return {startX, startY};
    });
const targetCanvasMouseMove$ = Observable.fromEvent(targetCanvasEl, 'mousemove')
    .throttleTime(16)
    .map((ev) => {
      const {offsetX, offsetY} = ev;
      return {localEndX: offsetX, localEndY: offsetY};
    });
const targetCanvasTouchMove$ = Observable.fromEvent(targetCanvasEl, 'touchmove')
    .throttleTime(16)
    .map((ev) => {
      const {touches} = ev;
      const {target} = touches[0];
      const {x, y} = target.getBoundingClientRect();
      let localEndX = touches[0].clientX - x;
      let localEndY = touches[0].clientY - y;
      return {localEndX, localEndY};
    });
const docMouseUp$ = Observable.fromEvent(document, 'mouseup');
const docTouchEnd$ = Observable.fromEvent(document, 'touchend');

const startDraw$ = targetCanvasMousedown$.merge(targetCanvastouchStart$);
const draw$ = targetCanvasMouseMove$.merge(targetCanvasTouchMove$);
const endDraw$ = docMouseUp$.merge(docTouchEnd$);

/**
 * Handles drawing a canvas by observing a mousedown, followed by mousemoves,
 * which will get recorded until mouseup. Essentially its drag-and-drop.
 */
const drawFlow$ = startDraw$
    .switchMap(({startX, startY}) => {
      const path = [];
      let endX;
      let endY;
      return draw$
          .map((ev) => {
            const {localEndX, localEndY} = ev;
            endX = localEndX;
            endY = localEndY;
            path.push({x: endX - startX, y: endY - startY});
            return {endX, endY, startX, startY, path};
          })
          .do(setPreviewCanvasItem)

          .takeUntil(
              endDraw$
                  // Only return the x/y offset of the canvas.
                  .map(() => ({endX, endY, startX, startY, path}))
                  // Render the primary canvas
                  .do(addOrModifyCanvasItem)
                  .do(unsetPreviewCanvasItem)
          );
    });

// We won't see any canvas drawing unless we subscribe to the observable.
drawFlow$.subscribe();

document.querySelectorAll('.actions').forEach((action) => {
  action.addEventListener('change', (ev) => {
    return updateCurrentActionFromInput(ev.target.value);
  });
});

document.querySelector('#actionFillColor').addEventListener('change', (ev) => {
  updateCurrentActionFill(ev.target.value);
});

document.querySelector('#actionLineColor').addEventListener('change', (ev) => {
  updateCurrentActionLine(ev.target.value);
});

document.querySelector('#actionLineWidth').addEventListener('change', (ev) => {
  updateCurrentActionLineWidth(ev.target.value);
});

layersEl.addEventListener('change', (ev) => {
  const {target} = ev;
  const dataset = target.dataset || {};
  const id = parseInt(dataset.id, 10);
  const action = dataset.action;

  switch (action) {
    case LayerCanvasActionEnums.CHANGE_FILL_COLOR:
      modifyCanvasItem({fillColor: target.value, id});
      break;
    case LayerCanvasActionEnums.CHANGE_LINE_COLOR:
      modifyCanvasItem({id, lineColor: target.value});
      break;
    case LayerCanvasActionEnums.SELECT:
      break;
    default:
  }
}, true);

layersEl.addEventListener('click', (ev) => {
  const dataset = ev.target.dataset || {};
  const id = parseInt(dataset.id, 10);
  const action = dataset.action;

  if (!id) {
    return;
  }

  switch (action) {
    case LayerCanvasActionEnums.COPY:
      copyCanvasItem(id);
      break;
    case LayerCanvasActionEnums.DELETE:
      removeCanvasItem(id);
      unsetPreviewCanvasItem();
      break;
    case LayerCanvasActionEnums.SELECT:
      setSelectedCanvasItem({id});
      break;
    default:
  }
}, true);

layersEl.addEventListener('mousemove', (ev) => {
  const id = parseInt(ev.target.dataset.id, 10);
  if (Number.isNaN(id)) {
    unsetPreviewCanvasItem();
    return;
  }
  highlightCanvasItem(id);
}, true);

layersEl.addEventListener('mouseleave', () => unsetPreviewCanvasItem(), true);


/**
 * Handles keyboard shortcuts, more to come after I play around with this
 * some more.
 */
document.addEventListener('keydown', (ev) => {
  const {key} = ev;
  switch (key) {
    case 'a':
      updateCurrentAction(CanvasActionEnums.RECTANGLE);
      break;
    case 's':
      updateCurrentAction(CanvasActionEnums.CIRCLE);
      break;
    case 'd':
      updateCurrentAction(CanvasActionEnums.LINE);
      break;
    case 'f':
      updateCurrentAction(CanvasActionEnums.BRUSH);
      break;
    case 'Backspace':
      removeSelectedCanvasItem();
      break;
    default:
  }
});
