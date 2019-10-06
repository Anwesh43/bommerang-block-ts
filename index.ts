const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const strokeFactor : number = 90
const sizeFactor : number = 2.9
const nodes : number = 5
const foreColor : string = "#4CAF50"
const backColor : string = "#BDBDBD"
const delay : number = 30
const blockFactor : number = 5

class BoomerangBlockStage {

    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = backColor
        this.context.fillRect(0, 0, w, h)
    }

    handleTap() {
        this.canvas.onmousedown = () => {

        }
    }

    static init() {
        const stage : BoomerangBlockStage = new BoomerangBlockStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {

    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += this.dir * scGap
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {

    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, delay)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class ScaleUtil {

    static maxScale(scale : number, i : number, n : number) : number {
        return Math.max(0, scale - i / n)
    }

    static divideScale(scale : number, i : number, n : number) : number {
        return Math.min(1 / n, ScaleUtil.maxScale(scale, i, n)) * n
    }
}

class DrawingUtil {
    static drawLine(context : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number) {
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()
    }

    static drawBoomerangBlock(context : CanvasRenderingContext2D, size : number, scale : number) {
        const x : number = size * Math.sin(Math.PI * scale)
        const blockSize : number = size / blockFactor
        DrawingUtil.drawLine(context, 0, 0, x, 0)
        context.save()
        context.translate(x, 0)
        context.fillRect(0, -blockSize / 2, blockSize, blockSize)
        context.restore()
    }

    static drawBBNode(context : CanvasRenderingContext2D, i : number, scale : number) {
        const size : number = w / sizeFactor
        const gap : number = size / (blockFactor)
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / strokeFactor
        context.strokeStyle = foreColor
        context.fillStyle = foreColor
        context.save()
        context.translate(0, gap * (i + 1))
        DrawingUtil.drawBoomerangBlock(context, size, scale)
        context.restore()
    }
}

class BBNode {

    next : BBNode
    prev : BBNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new BBNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        DrawingUtil.drawBBNode(context, this.i, this.state.scale)
        if (this.next) {
            this.next.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : BBNode {
        var curr : BBNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class BoomerangBlock {

    root : BBNode = new BBNode(0)
    curr : BBNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {

    bb : BoomerangBlock = new BoomerangBlock()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.bb.draw(context)
    }

    handleTap(cb : Function) {
        this.bb.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.bb.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
