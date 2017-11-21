import action from '../const/action';
import dispatcher from '../dispatcher';

const {ADD_CANVAS_ITEM} = action;

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
