import expect from 'expect.js';
import sinon from 'sinon';
import * as canvasRender from './canvas-render';

describe('canvas-render', () => {
  let mockCanvas;
  let mockCtx;

  beforeEach(() => {
    mockCanvas = {
      height: 500,
      width: 500,
    };
    mockCtx = {
      canvas: mockCanvas,
      clearRect: sinon.spy(),
    };
  });

  describe('drawCanvas', () => {
    it('should clear canvas and render canvasItem', () => {
      const canvasItemList = [];

      canvasRender.drawCanvas(mockCtx, canvasItemList);
      const isClearCalledWith = mockCtx.clearRect
          .calledWith(0, 0, mockCanvas.width, mockCanvas.height);
      expect(isClearCalledWith).to.eql(true);
    });
  });

  describe('clearCanvas', () => {
    it('should clear canvas', () => {
      canvasRender.clearCanvas(mockCtx);

      const isClearCalledWith = mockCtx.clearRect
          .calledWith(0, 0, mockCanvas.width, mockCanvas.height);
      expect(isClearCalledWith).to.eql(true);
    });
  });
});
