import action from '../const/action';
import dispatcher from '../dispatcher';

const {
  ADD_CANVAS_ITEM,
  REMOVE_CANVAS_ITEM,
  SET_PREVIEW_CANVAS_ITEM,
  UNSET_PREVIEW_CANVAS_ITEM
} = action;

/**
 * Adds a canvasItem to the currentCanvasItemList.
 * @param {!CanvasItem} canvasItem
 */
export const addCanvasItem = dispatcher((canvasItem) => {
  return {
    type: ADD_CANVAS_ITEM,
    payload: canvasItem
  };
});

/**
 * Removes a canvasItem from the currentCanvasItemList.
 * @param {number} id
 */
export const removeCanvasItem = dispatcher((id) => {
  return {
    type: REMOVE_CANVAS_ITEM,
    payload: id
  };
});

/**
 * Adds a canvasItem to the previewCanvasItemList.
 * @param {!CanvasItem} canvasItem
 */
export const setPreviewCanvasItem = dispatcher((canvasItem) => {
  return {
    type: SET_PREVIEW_CANVAS_ITEM,
    payload: canvasItem
  };
});

/**
 * Clears the previewCanvasItemList.
 */
export const unsetPreviewCanvasItem = dispatcher(() => {
  return {
    type: UNSET_PREVIEW_CANVAS_ITEM,
    payload: null
  };
});
