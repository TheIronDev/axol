import CanvasActionEnum from './const/canvas-action-enum';
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

  describe('getCanvasItemCenter', () => {
    it('should get center coordinates of brush', () => {
      const canvasItem = {
        path: [
          {x: -3, y: -3},
          {x: 7, y: 7},
          {x: 3, y: 3},
          {x: 1, y: -1},
          {x: -2, y: 6},
        ],
        startX: 13,
        startY: 13,
        type: CanvasActionEnum.BRUSH,
      };

      expect(canvasRender.getCanvasItemCenter(canvasItem)).to.eql({
        centerX: 15,
        centerY: 15,
      });
    });

    it('should get center coordinates of line', () => {
      const canvasItem = {
        xOffset: 10,
        yOffset: 10,
        startX: 10,
        startY: 10,
        type: CanvasActionEnum.LINE,
      };

      expect(canvasRender.getCanvasItemCenter(canvasItem)).to.eql({
        centerX: 15,
        centerY: 15,
      });
    });

    it('should get center coordinates of polygon', () => {
      const canvasItem = {
        path: [
          {x: -3, y: -3},
          {x: 7, y: 7},
          {x: 3, y: 3},
          {x: 1, y: -1},
          {x: -2, y: 6},
        ],
        startX: 13,
        startY: 13,
        type: CanvasActionEnum.POLYGON,
      };

      expect(canvasRender.getCanvasItemCenter(canvasItem)).to.eql({
        centerX: 15,
        centerY: 15,
      });
    });

    it('should get center coordinates of rectangle', () => {
      const canvasItem = {
        width: 10,
        height: 10,
        startX: 10,
        startY: 10,
        type: CanvasActionEnum.RECTANGLE,
      };

      expect(canvasRender.getCanvasItemCenter(canvasItem)).to.eql({
        centerX: 15,
        centerY: 15,
      });
    });

    it('should assume starting point is center point for other types', () => {
      const canvasItem = {
        startX: 15,
        startY: 15,
        type: CanvasActionEnum.CIRCLE,
      };

      expect(canvasRender.getCanvasItemCenter(canvasItem)).to.eql({
        centerX: 15,
        centerY: 15,
      });
    });
  });

  describe('renderCanvasItem', () => {
    it('should set + unset rotate, translation, and path', () => {
      const mockCanvasItem = {
        radius: 10,
        rotate: 1,
        type: CanvasActionEnum.CIRCLE,
      };
      const centerX = 10;
      const centerY = 10;

      canvasRender.renderCanvasItem(mockCtx, mockCanvasItem, centerX, centerY);

      expect(mockCtx.translate.calledWith(centerX, centerY)).to.be(true);
      expect(mockCtx.rotate.calledWith(mockCanvasItem.rotate * Math.PI / 180))
          .to.be(true);
      expect(mockCtx.beginPath.calledWith()).to.be(true);
      expect(mockCtx.closePath.calledWith()).to.be(true);
      expect(mockCtx.rotate.calledWith(-mockCanvasItem.rotate * Math.PI / 180))
          .to.be(true);
      expect(mockCtx.translate.calledWith(-centerX, -centerY)).to.be(true);
    });

    it('should render brush', () => {
      const mockCanvasItem = {
        path: [
          {x: 1, y: 1},
          {x: 2, y: 2},
          {x: -2, y: -1},
        ],
        startX: 10,
        startY: 10,
        rotate: 1,
        type: CanvasActionEnum.BRUSH,
      };
      const centerX = 15;
      const centerY = 15;

      canvasRender.renderCanvasItem(mockCtx, mockCanvasItem, centerX, centerY);

      const x = -centerX + mockCanvasItem.startX;
      const y = -centerY + mockCanvasItem.startY;
      expect(mockCtx.lineTo.calledWith(x + 1, y + 1)).to.be(true);
      expect(mockCtx.lineTo.calledWith(x + 2, y + 2)).to.be(true);
      expect(mockCtx.lineTo.calledWith(x - 2, y - 1)).to.be(true);
      expect(mockCtx.stroke.calledWith()).to.be(true);
    });

    it('should render circle', () => {
      const mockCanvasItem = {
        radius: 10,
        rotate: 1,
        type: CanvasActionEnum.CIRCLE,
      };
      const centerX = 10;
      const centerY = 10;

      canvasRender.renderCanvasItem(mockCtx, mockCanvasItem, centerX, centerY);

      expect(mockCtx.arc.calledWith(
          0, 0, mockCanvasItem.radius, 0, 2 * Math.PI, false)).to.be(true);
      expect(mockCtx.fill.calledWith()).to.be(true);
    });

    it('should render line', () => {
      const mockCanvasItem = {
        xOffset: 10,
        yOffset: 10,
        rotate: 1,
        type: CanvasActionEnum.LINE,
      };
      const centerX = 10;
      const centerY = 10;

      canvasRender.renderCanvasItem(mockCtx, mockCanvasItem, centerX, centerY);

      expect(mockCtx.moveTo.calledWith(-5, -5)).to.be(true);
      expect(mockCtx.lineTo.calledWith(5, 5)).to.be(true);
      expect(mockCtx.stroke.calledWith()).to.be(true);
    });

    it('should render polygon', () => {
      const mockCanvasItem = {
        path: [
          {x: 1, y: 1},
          {x: 2, y: 2},
          {x: -2, y: -1},
        ],
        startX: 10,
        startY: 10,
        rotate: 1,
        type: CanvasActionEnum.POLYGON,
      };
      const centerX = 15;
      const centerY = 15;

      canvasRender.renderCanvasItem(mockCtx, mockCanvasItem, centerX, centerY);

      const x = -centerX + mockCanvasItem.startX;
      const y = -centerY + mockCanvasItem.startY;
      expect(mockCtx.lineTo.calledWith(x + 1, y + 1)).to.be(true);
      expect(mockCtx.lineTo.calledWith(x + 2, y + 2)).to.be(true);
      expect(mockCtx.lineTo.calledWith(x - 2, y - 1)).to.be(true);
      expect(mockCtx.fill.calledWith()).to.be(true);
      expect(mockCtx.stroke.calledWith()).to.be(true);
    });

    it('should render rectangle', () => {
      const mockCanvasItem = {
        height: 10,
        width: 10,
        rotate: 1,
        type: CanvasActionEnum.RECTANGLE,
      };
      const centerX = 10;
      const centerY = 10;

      canvasRender.renderCanvasItem(mockCtx, mockCanvasItem, centerX, centerY);

      expect(mockCtx.fillRect.calledWith(-5, -5)).to.be(true);
    });
  });
});
