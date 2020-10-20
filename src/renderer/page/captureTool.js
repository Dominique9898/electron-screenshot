/* eslint-disable */

class Shape {
  constructor() {
    this.reset()
    this.lineWidth = 5
    this.strokeStyle = 'red'
  }

  reset() {
    this.startX = 0
    this.startY = 0
    this.endX = 0
    this.endY = 0
    this.isDrawing = false
  }

  start(x, y) {
    this.startX = this.endX = x
    this.startY = this.endY = y
    this.isDrawing = true
  }

  setStrokeStyle(strokeStyle) {
    this.strokeStyle = strokeStyle
  }

  setLineWidth(lineWidth) {
    this.lineWidth = lineWidth
  }
}

export class Rectangle extends Shape {
  constructor(asscanvas, scaleFactor) {
    super()
    this.type = 'rectangle'
    this.scaleFactor = scaleFactor
    this.ctx = asscanvas.getContext('2d')
    this.asscanvas = asscanvas
  }

  draw(historyRecord) {
    const ctx = this.ctx
    ctx.lineWidth = this.lineWidth * this.scaleFactor
    ctx.strokeStyle = this.strokeStyle
    ctx.clearRect(
      0,
      0,
      this.asscanvas.offsetWidth * this.scaleFactor,
      this.asscanvas.offsetHeight * this.scaleFactor
    )
    console.log(historyRecord)
    ctx.putImageData(historyRecord[historyRecord.length - 1], 0, 0)
    ctx.beginPath()
    ctx.rect(this.startX * this.scaleFactor, this.startY * this.scaleFactor, (this.endX - this.startX) * this.scaleFactor, (this.endY - this.startY) * this.scaleFactor)
    ctx.stroke()
  }
}

export class Ellipse extends Shape {
  constructor(asscanvas, scaleFactor) {
    super();
    this.type = 'ellipse'
    this.scaleFactor = scaleFactor
    this.asscanvas = asscanvas
    this.ctx = asscanvas.getContext('2d')
  }
  draw(historyRecord) {
    var x = (this.startX + this.endX) / 2
    var y = (this.startY + this.endY) / 2
    var w = this.endX - this.startX
    var h = this.endY - this.startY
    this.ctx.clearRect(
      0,
      0,
      this.asscanvas.offsetWidth * this.scaleFactor,
      this.asscanvas.offsetHeight * this.scaleFactor
    )
    this.ctx.putImageData(historyRecord[historyRecord.length - 1], 0, 0)
    this.drawEllipse(
      this.ctx,
      this.startX * this.scaleFactor,
      this.startY * this.scaleFactor,
      w * this.scaleFactor,
      h * this.scaleFactor)
  }
  drawEllipse(ctx, x, y, w, h) {
    ctx.lineWidth = this.lineWidth * this.scaleFactor
    ctx.strokeStyle = this.strokeStyle
    var kappa = 0.5522848
    var ox = (w / 2) * kappa // control point offset horizontal
    var oy = (h / 2) * kappa // control point offset vertical
    var xe = x + w // x-end
    var ye = y + h // y-end
    var xm = x + w / 2 // x-middle
    var ym = y + h / 2 // y-middle

    ctx.beginPath()
    ctx.moveTo(x, ym)
    ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y)
    ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym)
    ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye)
    ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym)
    ctx.closePath()
    ctx.stroke()
  }
}
export class Mosaic extends Shape{
  constructor(mainCanvas, selectRect, scaleFactor) {
    super()
    this.type = 'mosaic'
    this.scaleFactor = scaleFactor
    this.maincanvas = mainCanvas
    this.selectRect = selectRect
    this.mosaicBlockWidth = this.lineWidth
  }
  draw() {
    // 圆心 (this.endX, this.endY), 半径 R = this.mosaicBlockWidth
    if (this.lineWidth === 7) {
      this.mosaicBlockWidth = 15
    } else if (this.lineWidth === 5) {
      this.mosaicBlockWidth = 10
    } else {
      this.mosaicBlockWidth = 5
    }
    if (this.endX + this.mosaicBlockWidth >= this.selectRect.width  - this.scaleFactor ||
      this.endY + this.mosaicBlockWidth >= this.selectRect.height  - this.scaleFactor ||
      this.endX - this.mosaicBlockWidth <= this.scaleFactor ||
      this.endY - this.mosaicBlockWidth <= this.scaleFactor
    ) {
      return
    }
    const mainCtx = this.maincanvas.getContext('2d')
    mainCtx.globalCompositeOperation = "destination-out"
    mainCtx.beginPath();
    mainCtx.arc(this.endX + this.selectRect.x, this.endY + this.selectRect.y, this.mosaicBlockWidth, 0, Math.PI * 2)
    mainCtx.fill()
  }
}
export class Text extends Shape{
  constructor(props) {
    super(props)

  }

}
export class Arrow extends Shape {
  constructor(asscanvas, scaleFactor) {
    super()
    this.scaleFactor = scaleFactor
    this.ctx = asscanvas.getContext('2d')
    this.asscanvas = asscanvas
    this.type = 'arrow'
    var polygonVertex = []
    const that = this
    //封装的作图对象
    this.Plot = {
      angle: '',

      CONST: {
        edgeLen: 50,
        angle: 60
      },

      //在CONST中定义的edgeLen以及angle参数
      //短距离画箭头的时候会出现箭头头部过大，修改：
      dynArrowSize: function (beginPoint, stopPoint) {
        var x = stopPoint.x - beginPoint.x,
          y = stopPoint.y - beginPoint.y,
          length = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
        if (length < 50 * (that.lineWidth / 3)) {
          this.CONST.edgeLen = 12.5
          this.CONST.angle = this.CONST.angle / 2
        } else if (length < 150 * (that.lineWidth / 3) ) {
          this.CONST.edgeLen = this.CONST.edgeLen <= 25 ? this.CONST.edgeLen / 2 : 25
          this.CONST.angle = this.CONST.angle / 2
        } else if (length < 250 * (that.lineWidth / 3) ) {
          this.CONST.edgeLen = this.CONST.edgeLen <= 50 ? this.CONST.edgeLen / 2 : 50
          this.CONST.angle = this.CONST.angle / 2
        } else {
          this.CONST.edgeLen = this.CONST.edgeLen / 2
          this.CONST.angle = this.CONST.angle / 2
        }
        // console.log(length);
      },

      //getRadian 返回以起点与X轴之间的夹角角度值
      getRadian: function (beginPoint, stopPoint) {
        this.angle = (Math.atan2(stopPoint.y - beginPoint.y, stopPoint.x - beginPoint.x) / Math.PI) * 180
        // this.paraDef(50, 60)
        this.dynArrowSize(beginPoint, stopPoint)
      },

      ///获得箭头底边两个点
      arrowCoord: function (beginPoint, stopPoint) {
        polygonVertex[0] = beginPoint.x
        polygonVertex[1] = beginPoint.y
        polygonVertex[6] = stopPoint.x
        polygonVertex[7] = stopPoint.y
        this.getRadian(beginPoint, stopPoint)
        polygonVertex[8] =
          stopPoint.x - this.CONST.edgeLen * Math.cos((Math.PI / 180) * (this.angle + this.CONST.angle))
        polygonVertex[9] =
          stopPoint.y - this.CONST.edgeLen * Math.sin((Math.PI / 180) * (this.angle + this.CONST.angle))
        polygonVertex[4] =
          stopPoint.x - this.CONST.edgeLen * Math.cos((Math.PI / 180) * (this.angle - this.CONST.angle))
        polygonVertex[5] =
          stopPoint.y - this.CONST.edgeLen * Math.sin((Math.PI / 180) * (this.angle - this.CONST.angle))
      },

      //获取另两个底边侧面点
      sideCoord: function () {
        var midpoint = {}
        // midpoint.x = polygonVertex[6] - (CONST.edgeLen * Math.cos(Plot.angle * Math.PI / 180));
        // midpoint.y = polygonVertex[7] - (CONST.edgeLen * Math.sin(Plot.angle * Math.PI / 180));
        midpoint.x = (polygonVertex[4] + polygonVertex[8]) / 2
        midpoint.y = (polygonVertex[5] + polygonVertex[9]) / 2
        polygonVertex[2] = (polygonVertex[4] + midpoint.x) / 2
        polygonVertex[3] = (polygonVertex[5] + midpoint.y) / 2
        polygonVertex[10] = (polygonVertex[8] + midpoint.x) / 2
        polygonVertex[11] = (polygonVertex[9] + midpoint.y) / 2
      },

      //画箭头
      drawArrow: function (ctx) {
        ctx.beginPath()
        ctx.moveTo(polygonVertex[0], polygonVertex[1])
        ctx.lineTo(polygonVertex[2], polygonVertex[3])
        ctx.lineTo(polygonVertex[4], polygonVertex[5])
        ctx.lineTo(polygonVertex[6], polygonVertex[7])
        ctx.lineTo(polygonVertex[8], polygonVertex[9])
        ctx.lineTo(polygonVertex[10], polygonVertex[11])
        // ctx.lineTo(polygonVertex[0], polygonVertex[1]);
        ctx.closePath()
        ctx.fill()
      },

      //自定义参数
      paraDef: function (edgeLen, angle) {
        this.CONST.edgeLen = edgeLen
        this.CONST.angle = angle
      }
    }
  }

  draw(historyRecord) {
    const ctx = this.ctx
    ctx.clearRect(0, 0, this.asscanvas.offsetWidth, this.asscanvas.offsetHeight)
    this.ctx.putImageData(historyRecord[historyRecord.length - 1], 0, 0)
    var beginPoint = {}
    var stopPoint = {}
    beginPoint.x = this.startX * this.scaleFactor
    beginPoint.y = this.startY * this.scaleFactor
    stopPoint.x = this.endX - this.startX < 25 ? this.endX * this.scaleFactor + 12.5 * this.scaleFactor : this.endX * this.scaleFactor
    stopPoint.y = this.endY - this.startY < 25 ? this.endY * this.scaleFactor + 12.5 * this.scaleFactor : this.endY * this.scaleFactor
    ctx.fillStyle = this.strokeStyle
    let edgeLen = 50 * this.scaleFactor
    if (this.lineWidth === 3 ) {
      edgeLen = 25 * this.scaleFactor
    } else if (this.lineWidth === 7) {
      edgeLen = 100 * this.scaleFactor
    }
    this.Plot.paraDef(edgeLen, 60)
    this.Plot.arrowCoord(beginPoint, stopPoint)
    this.Plot.sideCoord()
    this.Plot.drawArrow(ctx)
  }
}
export class Curve extends Shape {
  constructor(asscanvas, selectRect, scaleFactor) {
    super();
    this.type = 'curve'
    this.ctx = asscanvas.getContext('2d')
    this.asscanvas = asscanvas
    this.selectRect = selectRect
    this.scaleFactor = scaleFactor
  }
  draw() {
    const ctx = this.ctx
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = this.strokeStyle
    let [x2,y2,x1, y1] = [this.endX, this.endY, this.startX, this.startY]
    const lineWidth = Math.ceil(this.lineWidth / 3)
    const asin = lineWidth * Math.sin(Math.atan((y2 - y1) / (x2 - x1)));
    const acos = lineWidth * Math.cos(Math.atan((y2 - y1) / (x2 - x1)));
    //分别获取矩形的四个点的xy轴位置
    const x3 = x1 + asin;
    const y3 = y1 - acos;
    const x4 = x1 - asin;
    const y4 = y1 + acos;
    const x5 = x2 + asin;
    const y5 = y2 - acos;
    const x6 = x2 - asin;
    const y6 = y2 + acos;

    ctx.beginPath();
    ctx.arc(x2 * this.scaleFactor, y2 * this.scaleFactor, lineWidth * this.scaleFactor, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(x3 * this.scaleFactor, y3 * this.scaleFactor);
    ctx.lineTo(x5 * this.scaleFactor, y5 * this.scaleFactor);
    ctx.lineTo(x6 * this.scaleFactor, y6 * this.scaleFactor);
    ctx.lineTo(x4 * this.scaleFactor, y4 * this.scaleFactor);
    ctx.fill();
    ctx.closePath();
    this.startX = x2;
    this.startY = y2;
  }
  reset() {
    super.reset()
    this.down = false
  }
}
export class Shapes extends Shape {
  constructor() {
    super()
    this.shapes = new Array()
  }

  push(shape) {
    this.shapes[this.shapes.length] = shape
  }

  draw(ctx) {
    super.draw(ctx)
    this.shapes.forEach(function (shape) {
      if (shape.type !== 'mosaic') {
        shape.draw(ctx)
      }
    })
  }

  undo() {
    if (this.canUndo()) {
      return this.shapes.pop()
    }
  }

  canUndo() {
    return this.shapes.length > 0
  }

  reset() {
    this.shapes = []
  }

  setStrokeStyle(strokeStyle) {
    this.strokeStyle = strokeStyle
  }

  setLineWidth(lineWidth) {
    this.lineWidth = lineWidth * this.scaleFactor
  }
}
