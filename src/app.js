import {Observable} from 'rxjs/Rx';
import LayerCanvasActionEnums from './const/layer-action-enum';
import ActionShapeIcon from './const/action-shape-icon';
import {clearCanvas, drawCanvas} from './canvas-render';

import {
  addOrModifyCanvasItem,
  highlightCanvasItem,
  modifyCanvasItem,
  removeCanvasItem,
  setPreviewCanvasItem,
  setSelectedCanvasItem,
  unsetPreviewCanvasItem,
  updateCurrentAction,
  updateCurrentActionFill,
  updateCurrentActionLine
} from "./actions/actions";
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
});

/**
 * @typedef {{type: CanvasActionEnum, id: number, startX: number, startY: number}}
 */
let CanvasItem;

/**
 * Updates the layers of actions
 * @param {!CanvasItem} canvasItem
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
  close.classList.add('closeLayer');
  close.innerText = 'delete';
  close.setAttribute('data-id', '' + id);
  close.setAttribute('data-action', LayerCanvasActionEnums.DELETE);

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
  li.appendChild(close);
  li.appendChild(shape);
  li.appendChild(fillColorInput);
  li.appendChild(lineColorInput);
  return li;
}

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
  const selected = document.getElementById(`#selected-${selectedCanvasItemId}`);
  if (selected) {
    selected.checked = true;
  }
}

const targetCanvasMousedown$ = Observable.fromEvent(targetCanvasEl, 'mousedown');
const docMouseMove$ = Observable.fromEvent(document, 'mousemove')
    .throttleTime(16);
const docMouseUp$ = Observable.fromEvent(document, 'mouseup');

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
      const path = [];
      return docMouseMove$
          // Map the mousemove event to a simple object
          .map((ev) => {
            const {offsetX: endX, offsetY: endY} = ev;
            path.push({x: endX - startX, y: endY - startY});
            return {endX, endY, startX, startY, id, path};
          })
          .do(setPreviewCanvasItem)

          .takeUntil(
              docMouseUp$
                  .map((ev) => {
                    const {offsetX: endX, offsetY: endY} = ev;
                    return {endX, endY, startX, startY, id, path};
                  })
                  // Render the primary canvas
                  .do(addOrModifyCanvasItem)
                  .do(unsetPreviewCanvasItem)
          );
    });

// We won't see any canvas drawing unless we subscribe to the observable.
canvasDraw$.subscribe();

document.querySelectorAll('.actions').forEach((action) => {
  action.addEventListener('change', (ev) => updateCurrentAction(ev.target.value));
});

document.querySelector('#actionFillColor').addEventListener('change', (ev) => {
  updateCurrentActionFill(ev.target.value);
});

document.querySelector('#actionLineColor').addEventListener('change', (ev) => {
  updateCurrentActionLine(ev.target.value);
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
