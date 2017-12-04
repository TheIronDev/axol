import {Subject} from 'rxjs/Rx';
import ActionEnum from './const/canvas-action-enum';
import reducer from  './reducer';

const initialState = {
  currentCanvasItemList: [],
  previewCanvasItemList: [],
  currentAction: ActionEnum.RECTANGLE,
  currentActionId: 1,
  currentActionFillColor: '#000',
  currentActionLineColor: '#000',
  currentActionLineWidth: 1,
  selectedCanvasItemId: null
};

// The ActionSubject is the entry point for our flux code to flow through.
const actionSubject$ = new Subject();

// The storeObserver is used to pipe dispatched events to anything that
// subscribes to the store. Effectively we will have something like:
// store.subscribe(renderAndUpdateUI);
const storeObserver$ = actionSubject$
    .startWith(initialState)
    .scan(reducer);

export const action$ = actionSubject$;
export const store$ = storeObserver$;
