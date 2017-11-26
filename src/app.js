import {Observable} from 'rxjs/Rx';
import CanvasActionEnum from './const/canvas-action-enum';
import LayerCanvasActionEnums from './const/layer-action-enum';
import ActionShapeIcon from './const/action-shape-icon';

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
  canvasItemList.forEach((canvasItem) => {
    if (!canvasItem) {
      return;
    }
    const {fillColor, lineColor, startX, startY, type, rotate} = canvasItem;
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = lineColor;

    // Retrieve the center of the canvasItem, used for centering.
    let centerX;
    let centerY;
    switch (type) {
      case CanvasActionEnum.BRUSH:
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

    // Rotate the canvas pivoted on the center of the canvasItem.
    ctx.translate(centerX, centerY);
    ctx.rotate(rotate * Math.PI / 180);

    // Begin drawing a canvasItem
    ctx.beginPath();

    // Depending on the canvasItem type, we draw shapes differently.
    switch (type) {
      case CanvasActionEnum.BRUSH:
        const {path} = canvasItem;
        const x = -centerX + startX;
        const y = -centerY + startY;
        path.forEach((point) => {
          ctx.lineTo(x + point.x, y + point.y);
        });
        ctx.stroke();
        break;
      case CanvasActionEnum.CIRCLE:
        const {radius} = canvasItem;
        ctx.arc(0, 0, radius, 0, 2 * Math.PI, false);
        ctx.fill();
        break;
      case CanvasActionEnum.LINE:
        const {xOffset, yOffset} = canvasItem;
        ctx.moveTo(-xOffset / 2, -yOffset / 2);
        ctx.lineTo(xOffset / 2, yOffset / 2);
        ctx.stroke();
        break;
      case CanvasActionEnum.RECTANGLE:
        const {width, height} = canvasItem;
        ctx.fillRect(-width / 2, -height/2, width, height);
        break;
      default:
    }

    // Always close the path.
    ctx.closePath();

    // Return the canvas back the original state before we were drawing the
    // canvasItem.
    ctx.rotate(-rotate * Math.PI / 180);
    ctx.translate(-centerX, -centerY);
  });
}

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
