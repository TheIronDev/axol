import Rx from 'rxjs/Rx';
import ActionEnum from './const/canvas-action-enum';
import action from './const/action';
import CanvasActionEnum from './const/canvas-action-enum';

const {
  ADD_OR_MODIFY_CANVAS_ITEM,
  HIGHLIGHT_CANVAS_ITEM,
  MODIFY_CANVAS_ITEM,
  REMOVE_CANVAS_ITEM,
  SET_PREVIEW_CANVAS_ITEM,
  SET_SELECTED_CANVAS_ITEM,
  UNSET_PREVIEW_CANVAS_ITEM,
  UPDATE_CURRENT_ACTION,
  UPDATE_CURRENT_ACTION_FILL,
  UPDATE_CURRENT_ACTION_LINE
} = action;

/**
 * @typedef {{
 *   currentCanvasItemList: !Array,
 *   previewCanvasItemList: !Array,
 *   currentAction: !ActionEnum,
 *   currentActionFillColor: string,
 *   currentActionLineColor: string,
 *   selectedCanvasItemId: ?number}} AppState
 */
let AppState;

const initialState = {
  currentCanvasItemList: [],
  previewCanvasItemList: [],
  currentAction: ActionEnum.RECTANGLE,
  currentActionFillColor: '#000',
  currentActionLineColor: '#000',
  selectedCanvasItemId: null
};

/**
 * Returns new canvasItem from recorded mousedown and mousemove/up states.
 * @param {!AppState} state
 * @param {{startX: number, startY: number, endX: number, endY: number}} payload
 * @return {?CanvasItem}
 */
function createNewCanvasItem(state, payload) {
  const {currentActionFillColor, currentActionLineColor, currentAction} = state;
  const {startX, startY, endX, endY, id} = payload;
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
 * @param {!AppState} state
 * @param {{startX: number, startY: number, endX: number, endY: number}} payload
 * @return {?CanvasItem}
 */
function modifyCanvasItem(state, payload) {
  const {startX, startY, endX, endY} = payload;
  let canvasItem;
  let selectedCanvasItem;

  switch (state.currentAction) {
    case CanvasActionEnum.MOVE:
      selectedCanvasItem = state.currentCanvasItemList
          .find((canvasItem) =>  canvasItem.id === state.selectedCanvasItemId);
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
 * @param {!AppState} state
 * @param {{startX: number, startY: number, endX: number, endY: number}} payload
 * @return {?CanvasItem}
 */
function createCanvasItem(state, payload) {
  switch (state.currentAction) {
    case CanvasActionEnum.CIRCLE:
    case CanvasActionEnum.RECTANGLE:
    case CanvasActionEnum.LINE:
      return createNewCanvasItem(state, payload);
    case CanvasActionEnum.MOVE:
      return modifyCanvasItem(state, payload);
    default:
  }
  return null;
}

/**
 * Reducer function used to handle the different type of switch-case events.
 * @param state
 * @param dispatchedAction
 * @returns {AppState}
 */
const reducer = (state, dispatchedAction) => {
  const {type, payload} = dispatchedAction;
  const newState = Object.assign({}, state);

  let currentCanvasItemList;
  let selectedCanvasItemId;

  switch (type) {
    case ADD_OR_MODIFY_CANVAS_ITEM:
      const newCanvasItem = createCanvasItem(state, payload);
      switch (state.currentAction) {
        case CanvasActionEnum.CIRCLE:
        case CanvasActionEnum.RECTANGLE:
        case CanvasActionEnum.LINE:
          selectedCanvasItemId = newCanvasItem.id;
          currentCanvasItemList =
              [...state.currentCanvasItemList, newCanvasItem];
          return Object.assign(
              newState,
              {currentCanvasItemList, selectedCanvasItemId});
        case CanvasActionEnum.MOVE:
          currentCanvasItemList = state.currentCanvasItemList
              .map((canvasItem) => {
                if (canvasItem.id === newCanvasItem.id) {
                  return Object.assign({}, canvasItem, newCanvasItem);
                }
                return canvasItem;
              });
          return Object.assign(newState, {currentCanvasItemList});
      }
    case HIGHLIGHT_CANVAS_ITEM:
      const canvasItemToHighlight = state.currentCanvasItemList
          .find((canvasItem) => canvasItem.id === payload);
      const highlight = Object.assign(
          {},
          canvasItemToHighlight,
          {fillColor: '#f00', lineColor: '#f00'});

      return Object.assign(newState, {previewCanvasItemList: [highlight]});
    case MODIFY_CANVAS_ITEM:
      currentCanvasItemList = state.currentCanvasItemList
          .map((canvasItem) => {
            return (canvasItem.id !== payload.id) ?
                canvasItem :
                Object.assign({}, canvasItem, payload);
            if (canvasItem.id !== payload.id) {
              return canvasItem;
            }
            return Object.assign({}, canvasItem, payload);
          });
      return Object.assign(
          newState,
          {currentCanvasItemList});
    case REMOVE_CANVAS_ITEM:
      currentCanvasItemList = state.currentCanvasItemList
          .filter((canvasItem) => canvasItem.id !== payload);
      if (state.selectedCanvasItemId !== payload) {
        return Object.assign(newState, {currentCanvasItemList});
      }
      selectedCanvasItemId = currentCanvasItemList.length ?
          currentCanvasItemList[currentCanvasItemList.length - 1].id :
          null;
        return Object.assign(
            newState,
            {currentCanvasItemList, selectedCanvasItemId});
    case SET_PREVIEW_CANVAS_ITEM:
      const previewCanvasItemList = [createCanvasItem(state, payload)];
      return Object.assign(newState, {previewCanvasItemList});

    // The following actions are simple and don't need to make use of existing
    // AppState to figure what to add.
    case SET_SELECTED_CANVAS_ITEM:
    case UNSET_PREVIEW_CANVAS_ITEM:
    case UPDATE_CURRENT_ACTION:
    case UPDATE_CURRENT_ACTION_FILL:
    case UPDATE_CURRENT_ACTION_LINE:
      return Object.assign(newState, payload);
    default:
      return state;
  }
};

// The ActionSubject is the entry point for our flux code to flow through.
const actionSubject$ = new Rx.Subject();

// The storeObserver is used to pipe dispatched events to anything that
// subscribes to the store. Effectively we will have something like:
// store.subscribe(renderAndUpdateUI);
const storeObserver$ = actionSubject$
    .startWith(initialState)
    .scan(reducer);

export const action$ = actionSubject$;
export const store$ = storeObserver$;
