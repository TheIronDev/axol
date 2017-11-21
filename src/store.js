import Rx from 'rxjs/Rx';
import ActionEnum from './const/canvas-action-enum';
import action from './const/action';

const {ADD_CANVAS_ITEM} = action;

const initialState = {
  currentCanvasItemList: [],
  previewCanvasItemList: [],
  currentAction: ActionEnum.RECTANGLE,
  currentActionFillColor: '#000',
  currentActionLineColor: '#000',
  selectedCanvasItem: null
};

/**
 * Reducer function used to handle the different type of switch-case events.
 * @param state
 * @param dispatchedAction
 * @returns {*}
 */
const reducer = (state, dispatchedAction) => {
  const {type, payload} = dispatchedAction;
  switch (type) {
    case ADD_CANVAS_ITEM:
      const currentCanvasItemList =
          [...state.currentCanvasItemList, payload];
      return Object.assign(
          {},
          state,
          {currentCanvasItemList});
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