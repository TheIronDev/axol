import ActionEnum from './const/canvas-action-enum';
import expect from 'expect.js';
import action from './const/action';
import reducer from './reducer';

const {
  BRUSH,
  LINE,
  MOVE,
  CIRCLE,
  RECTANGLE,
  ROTATE
} = ActionEnum;

function getCanvasItem(payload) {
  const baseCanvasItem = {
    fillColor: '#000',
    lineColor: '#000',
    rotate: 0,
    startX: 0,
    startY: 0
  };
  return Object.assign({}, baseCanvasItem, payload);
}

describe('reducer', () => {
  let initialState;
  let dispatchedAction;

  beforeEach(() => {
    initialState = {
      currentCanvasItemList: [],
      previewCanvasItemList: [],
      currentAction: RECTANGLE,
      currentActionFillColor: '#000',
      currentActionLineColor: '#000',
      selectedCanvasItemId: null
    };
    dispatchedAction = {type: '', payload: ''};
  });

  describe('default', () => {
    it('should return intial state by default', () => {
      dispatchedAction = {type: '?', payload: '?'};
      expect(reducer(initialState, dispatchedAction)).to.eql(initialState);
    });
  });

  describe('ADD_OR_MODIFY_CANVAS_ITEM', () => {
    it('should add a circle if currentAction is CIRCLE', () => {
      initialState.currentAction = CIRCLE;
      dispatchedAction = {
        type: action.ADD_OR_MODIFY_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 1, endY: 0, id: 29}
      };
      const expectedCanvasItem = getCanvasItem(
          {id: 29, radius: 1, type: CIRCLE});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList).to.eql([expectedCanvasItem]);
    });

    it('should add a rectangle if currentAction is RECTANGLE', () => {
      initialState.currentAction = RECTANGLE;
      dispatchedAction = {
        type: action.ADD_OR_MODIFY_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 2, endY: 2, id: 30}
      };
      const expectedCanvasItem = getCanvasItem(
          {id: 30, height: 2, type: RECTANGLE, width: 2});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList).to.eql([expectedCanvasItem]);
    });

    it('should add a line if currentAction is LINE', () => {
      initialState.currentAction = LINE;
      dispatchedAction = {
        type: action.ADD_OR_MODIFY_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 2, endY: 2, id: 31}
      };

      const expectedCanvasItem = getCanvasItem(
          {id: 31, type: LINE, yOffset: 2, xOffset: 2});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList).to.eql([expectedCanvasItem]);
    });

    it('should add a brush stroke if currentAction is BRUSH', () => {
      const path = [
        {x: 2, y: 0},
        {x: 2, y: 2},
        {x: 0, y: 2},
        {x: 0, y: 0}
      ];
      initialState.currentAction = BRUSH;
      dispatchedAction = {
        type: action.ADD_OR_MODIFY_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 2, endY: 2, id: 31, path}
      };

      const expectedCanvasItem = getCanvasItem(
          {id: 31, type: BRUSH, path});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList).to.eql([expectedCanvasItem]);
    });

    it('should update canvasItem if currentAction is MOVE', () => {
      initialState.currentAction = MOVE;
      initialState.currentCanvasItemList = [
        getCanvasItem({id: 31, type: LINE, yOffset: 2, xOffset: 2}),
        getCanvasItem({id: 30,type: LINE, yOffset: 2,xOffset: 2})
      ];
      initialState.selectedCanvasItemId = 30;
      dispatchedAction = {
        type: action.ADD_OR_MODIFY_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 2, endY: 2, id: 32}
      };
      const expectedCanvasItem = getCanvasItem(
          {id: 30, startX: 2, startY: 2, type: LINE, yOffset: 2,xOffset: 2});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList[1]).to.eql(expectedCanvasItem);
    });

    it('should update canvasItem if currentAction is ROTATE', () => {
      initialState.currentAction = ROTATE;
      initialState.currentCanvasItemList = [
        getCanvasItem({id: 32, type: LINE, yOffset: 2, xOffset: 2}),
        getCanvasItem({id: 31, type: LINE, yOffset: 2, xOffset: 2}),
        getCanvasItem({id: 30, type: LINE, yOffset: 2,xOffset: 2})
      ];
      initialState.selectedCanvasItemId = 30;
      dispatchedAction = {
        type: action.ADD_OR_MODIFY_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 2, endY: 2, id: 33}
      };
      const expectedCanvasItem = getCanvasItem(
          {id: 30, rotate: 4, type: LINE, yOffset: 2, xOffset: 2});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList[2]).to.eql(expectedCanvasItem);
    });
  });

  describe('HIGHLIGHT_CANVAS_ITEM', () => {
    it('should highlight a canvas item (into the previewList)', () => {
      const item3 = getCanvasItem({id: 32, type: LINE, yOffset: 2, xOffset: 2});
      const item2 = getCanvasItem({id: 31, type: LINE, yOffset: 2, xOffset: 2});
      const item1 = getCanvasItem({id: 30, type: LINE, yOffset: 2, xOffset: 2});
      initialState.currentCanvasItemList = [item3, item2, item1];
      dispatchedAction = {
        type: action.HIGHLIGHT_CANVAS_ITEM,
        payload: 31
      };
      const expectedCanvasItem = Object.assign(
          {}, item2, {fillColor: '#f00', lineColor: '#f00'});

      const result = reducer(initialState, dispatchedAction);
      expect(result.previewCanvasItemList[0]).to.eql(expectedCanvasItem);
    });
  });

  describe('MODIFY_CANVAS_ITEM', () => {
    it('should modify a canvas item', () => {
      const item3 = getCanvasItem({id: 32, type: LINE, yOffset: 2, xOffset: 2});
      const item2 = getCanvasItem({id: 31, type: LINE, yOffset: 2, xOffset: 2});
      const item1 = getCanvasItem({id: 30, type: LINE, yOffset: 2, xOffset: 2});
      initialState.currentCanvasItemList = [item3, item2, item1];
      dispatchedAction = {
        type: action.MODIFY_CANVAS_ITEM,
        payload: {id: 31, fillColor: '#f0f', lineColor: '#f0f'}
      };
      const expectedCanvasItem = Object.assign(
          {}, item2, {fillColor: '#f0f', lineColor: '#f0f'});

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList[1]).to.eql(expectedCanvasItem);
    });
  });

  describe('REMOVE_CANVAS_ITEM', () => {
    it('should remove a canvas item', () => {
      const item3 = getCanvasItem({id: 32, type: LINE, yOffset: 2, xOffset: 2});
      const item2 = getCanvasItem({id: 31, type: LINE, yOffset: 2, xOffset: 2});
      const item1 = getCanvasItem({id: 30, type: LINE, yOffset: 2, xOffset: 2});
      initialState.currentCanvasItemList = [item3, item2, item1];
      dispatchedAction = {
        type: action.REMOVE_CANVAS_ITEM,
        payload: 31
      };

      const result = reducer(initialState, dispatchedAction);
      expect(result.currentCanvasItemList[1]).to.eql(item1);
    });
  });

  describe('SET_PREVIEW_CANVAS_ITEM', () => {
    it('should set a preview canvas item', () => {
      initialState.currentAction = LINE;
      dispatchedAction = {
        type: action.SET_PREVIEW_CANVAS_ITEM,
        payload: {startX: 0, startY: 0, endX: 2, endY: 2, id: 30}
      };

      const expected =
          getCanvasItem({id: 30, type: LINE, yOffset: 2, xOffset: 2});

      const result = reducer(initialState, dispatchedAction);
      expect(result.previewCanvasItemList[0]).to.eql(expected);
    });
  });
});
