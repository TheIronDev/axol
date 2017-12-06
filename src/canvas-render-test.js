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
      arc: sinon.spy(),
      beginPath: sinon.spy(),
      clearRect: sinon.spy(),
      closePath: sinon.spy(),
      fill: sinon.spy(),
      fillRect: sinon.spy(),
      lineTo: sinon.spy(),
      moveTo: sinon.spy(),
      rotate: sinon.spy(),
      stroke: sinon.spy(),
      translate: sinon.spy(),
    };
  });

  describe('clearCanvas', () => {
    it('should clear canvas', () => {
      canvasRender.clearCanvas(mockCtx);

      const isClearCalledWith = mockCtx.clearRect
          .calledWith(0, 0, mockCanvas.width, mockCanvas.height);
      expect(isClearCalledWith).to.be(true);
    });
  });

  describe('drawCanvas', () => {
    it('should clear canvas and render canvasItem', () => {
      const canvasItemList = [];

      canvasRender.drawCanvas(mockCtx, canvasItemList);
      const isClearCalledWith = mockCtx.clearRect
          .calledWith(0, 0, mockCanvas.width, mockCanvas.height);
      expect(isClearCalledWith).to.be(true);
    });
  });

  describe('canvasItemRender', () => {
    it('should return a function that handles rendering canvasItems', () => {
      const renderer = canvasRender.canvasItemRenderer(mockCtx);
      const mockCanvasItem = {
        endY: 50,
        fillColor: '#f0f',
        lineColor: '#0f0',
        lineWidth: 2,
        rotate: 0,
        startX: 50,
      };
      renderer(mockCanvasItem);

      expect(mockCtx.fillStyle).to.be(mockCanvasItem.fillColor);
      expect(mockCtx.strokeStyle).to.be(mockCanvasItem.lineColor);
      expect(mockCtx.lineWidth).to.be(mockCanvasItem.lineWidth);
    });

    it('should do nothing if passed null or undefined', () => {
      const renderer = canvasRender.canvasItemRenderer(mockCtx);

      renderer(null);
      expect(mockCtx.fillStyle).to.be(undefined);

      renderer();
      expect(mockCtx.fillStyle).to.be(undefined);
    });
  });
});
