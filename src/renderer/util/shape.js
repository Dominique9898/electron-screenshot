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
  draw(shapes) {
    const ctx = this.ctx
    ctx.lineWidth = this.lineWidth * this.scaleFactor
    ctx.strokeStyle = this.strokeStyle
    ctx.clearRect(
      0,
      0,
      this.asscanvas.offsetWidth * this.scaleFactor,
      this.asscanvas.offsetHeight * this.scaleFactor
    )
    if (shapes.length > 1) ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
    ctx.beginPath()
    ctx.rect(this.startX * this.scaleFactor, this.startY * this.scaleFactor, (this.endX - this.startX) * this.scaleFactor, (this.endY - this.startY) * this.scaleFactor)
    ctx.stroke()
  }
  undo(shapes) {
    if (shapes.length === 1) {
      this.ctx.clearRect(0, 0, this.asscanvas.width, this.asscanvas.height)
    } else {
      this.ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
    }
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
  undo(shapes) {
    if (shapes.length === 1) {
      this.ctx.clearRect(0, 0, this.asscanvas.width, this.asscanvas.height)
    } else {
      this.ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
    }
  }
  draw(shapes) {
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
    if (shapes.length > 1) this.ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
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
    this.ctx = mainCanvas.getContext('2d')
    this.selectRect = selectRect
    this.mosaicBlockWidth = this.lineWidth
  }
  draw() {
    if (this.endX + this.mosaicBlockWidth >= this.selectRect.width  - this.scaleFactor ||
      this.endY + this.mosaicBlockWidth >= this.selectRect.height  - this.scaleFactor ||
      this.endX - this.mosaicBlockWidth <= this.scaleFactor ||
      this.endY - this.mosaicBlockWidth <= this.scaleFactor
    ) {
      return
    }

    // 圆心 (this.endX, this.endY), 半径 R = this.mosaicBlockWidth
    if (this.lineWidth === 7) {
      this.mosaicBlockWidth = 15
    } else if (this.lineWidth === 5) {
      this.mosaicBlockWidth = 10
    } else {
      this.mosaicBlockWidth = 5
    }

    this.ctx.globalCompositeOperation = "destination-out"
    this.ctx.beginPath();
    this.ctx.arc(this.endX + this.selectRect.x, this.endY + this.selectRect.y, this.mosaicBlockWidth, 0, Math.PI * 2)
    this.ctx.fill()
  }
  undo(shapes) {
    this.ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
  }
}
export class Text extends Shape{
  constructor(selectRect) {
    super()
    this.fontSize = 22
    this.node = null
    this.selectRect = selectRect
    this.editorText = false
    this.type = 'text'
    this.textHelperStyle = {
      position: 'absolute',
      'font-size': this.fontSize + 'px',
      'line-height': this.fontSize + 'px',
      'min-width': this.fontSize + 'px',
      'min-height': this.fontSize + 'px',
      color: 'red',
      outline: 'none',
      left: 0,
      top: 0,
      cursor: 'text',
      border: '1px solid black',
      'transform': 'translate(-50%, -50%)',
      display: 'none',
      'background-color': 'transparent',
      padding: '8px',
      'user-select': 'none',
      '-webkit-user-select': 'none',
      'z-index': '4',
      'font-family': 'Microsoft YaHei,Sans Serif,System UI',
    }
    let textHelper = document.getElementById('textHelper')
    let textContainer = document.getElementById('textContainer')
    if (!textHelper && !textContainer) {
      textContainer = document.createElement('div')
      textContainer.setAttribute( 'id', 'textContainer')
      textContainer.style.cssText = `position: absolute;overflow:hidden;left: ${this.selectRect.x}px; top:${this.selectRect.y}px; width:${this.selectRect.width}px; height:${this.selectRect.height}px`

      let style = ''
      textHelper = document.createElement('div')
      for (let key in this.textHelperStyle) {
        style += `${key}:${this.textHelperStyle[key]};`
      }
      textHelper.setAttribute('contenteditable', true)
      textHelper.setAttribute('id', 'textHelper')
      textHelper.style.cssText = style
      const capture = document.getElementById('capture')
      textContainer.appendChild(textHelper)
      capture.appendChild(textContainer)
    } else {
      textContainer.style.cssText = `position: absolute;overflow:hidden;left: ${this.selectRect.x}px; top:${this.selectRect.y}px; width:${this.selectRect.width}px; height:${this.selectRect.height}px`
    }
  }
  draw(shapes) {
    if (this.editorText) {
      if (this.node.style.border) {
        // 双击节点后未被选中后blur
        this.editorText = false
        this.node.style.cursor = 'move'
        this.node.style.border = ''
        this.node.setAttribute('contenteditable', false)
      }
      return
    }
    const textHelper = document.getElementById('textHelper')
    let innerText = textHelper && textHelper.innerText ? textHelper.innerText : ''
    console.log('draw text', innerText)
    if (innerText.length === 0) {
      // x, y 是针对asscanvas 的offsetX, offsetY
      textHelper.style.left = this.startX + 'px'
      textHelper.style.top = this.startY + 'px'
      textHelper.style.display = 'block'
      if (!shapes.length || shapes[shapes.length - 1].type !== 'textHelper') {
        // 防止重复添加
        shapes.push({
          type:'textHelper',
          shape: this
        })
      }
    } else {
      this.createTextNode(shapes)
    }
  }
  undo(shapes) {
    const lastRecord = shapes[shapes.length - 1] // 待撤销的data
    if (lastRecord.type === 'text') {
      const textNodes = document.querySelectorAll('.textNode')
      const lastNode = textNodes[textNodes.length - 1]
      document.getElementById('textContainer').removeChild(lastNode)
    } else if (lastRecord.type === 'textmove') {
      const data = lastRecord.data
      data.node.style.left = data.left + 'px'
      data.node.style.top = data.top + 'px'
    } else if (lastRecord.type === 'textHelper') {
      const textHelper = document.getElementById('textHelper')
      textHelper.style.display = 'none'
      textHelper.innerText = ''
    } else if (lastRecord.type === 'editortext') {
      console.log(lastRecord.data.node)
      console.log(lastRecord.data.innerText)
      lastRecord.data.node.innerText = lastRecord.data.Text
    }
  }
  createTextNode(shapes) {
    shapes.pop() // pop出textHelper
    const textHelper = document.getElementById('textHelper')
    let style = ''
    style = textHelper.style.cssText
    const textNode = document.createElement('div')
    textNode.className = 'textNode'
    textNode.style.cssText = style
    textNode.style.border = ''
    textNode.style.cursor = 'move'

    textHelper.style.display = 'none'

    textNode.innerText = textHelper.innerText
    textHelper.innerText = ''

    shapes.push({
      type: 'text',
      shape: this
    })

    document.getElementById('textContainer').appendChild(textNode)
    let flag = false
    let move = false
    textNode.onmousedown = (e) => {
      // 防止单次点击与双击冲突
      if (this.editorText) return
      if (textHelper.innerText.length > 0 ) this.createTextNode(shapes)
      textHelper.style.display = 'none'

      const left = parseInt(textNode.style.left)
      const top = parseInt(textNode.style.top)

      this.startX = e.clientX
      this.startY = e.clientY
      flag = true

      document.onmousemove = (e) => {
        const moveLength = Math.sqrt(Math.pow(this.startX - e.clientX, 2) + Math.pow(this.startY - e.clientY, 2))
        console.log(moveLength)
        if (!this.editorText && moveLength > 1 && flag) {
          move = true
          textNode.style.left = left + (e.clientX - this.selectRect.x - left)  + 'px'
          textNode.style.top = top + (e.clientY - this.selectRect.y - top) + 'px'
        }
      }


      document.onmouseup = (e) => {
        if(flag && move && !this.editorText) {
          shapes.push({
            type: 'textmove',
            data: {
              node: textNode,
              left: left,
              top: top
            },
            shape: this
          })
          document.onmousemove = null
          document.onmouseup = null
        }
        flag = false
        move = false
      }
    }
    textNode.ondblclick = (e) => {
      this.editorText = true
      this.node = textNode
      let innerText = textNode.innerText
      textNode.setAttribute('contenteditable', true)
      textNode.style.cursor = 'text'
      textNode.style.border = '1px solid black'
      textNode.onblur = () => {
        this.editorText = false
        textNode.style.cursor = 'move'
        textNode.style.border = ''
        textNode.setAttribute('contenteditable', false)
        if (textNode.innerText !== innerText) {
          shapes.push({
            type:'editortext',
            data: {
              node:textNode,
              Text: innerText
            },
            shape: this
          })
        }
      }
    }
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

  draw(shapes) {
    const ctx = this.ctx
    ctx.clearRect(
      0,
      0,
      this.asscanvas.offsetWidth * this.scaleFactor,
      this.asscanvas.offsetHeight * this.scaleFactor
    )
    if (shapes.length > 1) ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
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
  undo(shapes) {
    if (shapes.length === 1) {
      this.ctx.clearRect(0, 0, this.asscanvas.width, this.asscanvas.height)
    } else {
      this.ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
    }
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
  undo(shapes) {
    if (shapes.length === 1) {
      this.ctx.clearRect(0, 0, this.asscanvas.width, this.asscanvas.height)
    } else {
      this.ctx.putImageData(shapes[shapes.length - 1].data, 0, 0)
    }
  }
}
export class Shapes extends Shape {
  constructor() {
    super()
    this.shapes = []
  }

  push(currentImageData) {
    this.shapes.push(currentImageData)
  }

  undo() {
    const curShape = this.shapes[this.shapes.length - 1].shape // 待撤销的data
    curShape.undo(this.shapes)
    this.shapes.pop()
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
