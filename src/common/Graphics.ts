import Card from "../gameobjects/card/Card"
import { Vector } from "../math/Vector"

export default class Graphics {
    static instance: Graphics
    canvas: HTMLCanvasElement
    c: CanvasRenderingContext2D
    size!: Vector
    constructor() {
        Graphics.instance = this
        this.canvas = <HTMLCanvasElement>document.getElementById( "canvas1" )
        this.c = this.canvas.getContext( "2d" ) as CanvasRenderingContext2D
        this.onResize()
    }

    onResize() {
        let { canvas } = this
        let rect = canvas.getBoundingClientRect()
        canvas.width = rect.width
        canvas.height = rect.height
        this.size = new Vector( this.canvas.width, this.canvas.height )
    }

    vTranslate( v: Vector ) {
        this.c.translate( v.x, v.y )
    }

    drawRect( pos: Vector, size: Vector, color: string = "red" ) {
        this.c.fillStyle = color
        this.c.fillRect( pos.x, pos.y, size.x, size.y )
    }
    drawRoundRect( pos: Vector, size: Vector, color: string = "black", radius: number ) {
        this.c.fillStyle = color
        this.c.beginPath()

        this.c.moveTo(pos.x + radius, pos.y)
        this.c.arcTo( pos.x + size.x, pos.y, pos.x + size.x, pos.y + size.y, radius )
        this.c.arcTo( pos.x + size.x, pos.y + size.y, pos.x, pos.y + size.y, radius )
        this.c.arcTo( pos.x, pos.y + size.y, pos.x, pos.y, radius )
        this.c.arcTo( pos.x, pos.y, pos.x + size.x, pos.y, radius )
        this.c.closePath()
        this.c.fill()
    }
    strokeRect( pos: Vector, size: Vector, color: string = "black" ) {
        this.c.strokeStyle = color
        this.c.beginPath()
        this.c.strokeRect( pos.x, pos.y, size.x, size.y )
    }
    strokeCircle( pos: Vector, radius: number, color: string = "black" ) {
        this.c.beginPath()
        this.c.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
        this.c.strokeStyle = color
        this.c.stroke()
    }
    fillCircle( pos: Vector, radius: number, color: string = "black" ) {
        this.c.beginPath()
        this.c.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
        this.c.fillStyle = color
        this.c.fill()
    }
    drawPip( pos:Vector, dim:Vector, fill:string = "white", stroke:string = "black") {
        this.drawRect(pos, dim, fill)
        this.strokeRect(pos, dim, stroke)
    }
    pipBlock( pos:Vector, dim:Vector, value:number, radix:number, vertical=false, fill = "white", empty = "black") {
        //divide dim by radix+1
        let pipDim = dim
        if ( vertical ) {
            pipDim.y = pipDim.y / (radix+1)
        } else {
            pipDim.x = pipDim.x / (radix+1)
        }
        let buffer = pipDim.scale(1/(radix-1))
        this.c.lineWidth = 0.1
        for ( let i = 0; i < radix; i++ ) {
        //     //start at pos
            let pipPos = pos
            if ( vertical ) {
                pipPos = pipPos.add(new Vector(0, pipDim.y*i+buffer.y*i))
            } else {
                pipPos = pipPos.add(new Vector(buffer.x*i+pipDim.x*i, 0))
            }
            if (i < value) {
                this.drawPip(pipPos, pipDim, fill, "black")
            } else {
                this.drawPip(pipPos, pipDim, empty)
            }
        }
    }
    costDisplay(pos: Vector, cost: string, color1: string, color2: string, fontSize = 10 ) {
        // this.drawRect(pos, dim, this.type.color)
        this.drawRect(pos.add(new Vector(1.5, 1)), new Vector(7, 8), color2)
        this.setFont(fontSize, "pixel2")
        this.drawText(pos.add(new Vector(1.5, 1)), cost, color1)
    }

    makePath( path: Vector[] ) {
        if ( path.length == 0 )
            return
        this.c.beginPath()
        this.c.moveTo( path[ 0 ].x, path[ 0 ].y )
        for ( let i = 1; i < path.length; i++ )
            this.c.lineTo( path[ i ].x, path[ i ].y )
    }

    setFont( size: number, font: string ) {
        this.c.font = size + "px " + font
    }

    textDimensions( text: string ) {
        let metrics = this.c.measureText( text )
        return new Vector( metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent )
    }

    drawText( pos: Vector, text: string, color: string,  options?: { padding?: number, boxColor?: string, alignX?: TextAlignX, alignY?: TextAlignY } ) {
        let padding = options?.padding ?? 1
        let textColor = color ?? "white"
        let boxColor = options?.boxColor ?? "black"
        let alignX = options?.alignX ?? TextAlignX.left
        let alignY = options?.alignY ?? TextAlignY.top

        let metrics = this.c.measureText( text )

        let p = padding, p2 = padding * 2
        let textDims = new Vector( metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent )
        let textBoxDims = textDims.addXY( p2, p2 )
        let textBoxOffset = pos.addXY( -textBoxDims.x * alignX, -textBoxDims.y * alignY )
        let textOffset = textBoxOffset.addXY( p, p + metrics.actualBoundingBoxAscent )
        this.c.fillStyle = textColor
        this.c.fillText( text, textOffset.x, textOffset.y )

        return textBoxDims
    }

    drawTextBox( pos: Vector, text: string, options: { padding?: number, textColor?: string, boxColor?: string, alignX?: TextAlignX, alignY?: TextAlignY } ) {
        let padding = options.padding ?? 1
        let textColor = options.textColor ?? "white"
        let boxColor = options.boxColor ?? "black"
        let alignX = options.alignX ?? TextAlignX.left
        let alignY = options.alignY ?? TextAlignY.top

        let metrics = this.c.measureText( text )

        let p = padding, p2 = padding * 2
        let textDims = new Vector( metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent )
        let textBoxDims = textDims.addXY( p2, p2 )
        let textBoxOffset = pos.addXY( -textBoxDims.x * alignX, -textBoxDims.y * alignY )
        let textOffset = textBoxOffset.addXY( p, p + metrics.actualBoundingBoxAscent )
        this.drawRect( textBoxOffset, textBoxDims, boxColor )
        this.drawText( textOffset, text, textColor )

        return textBoxDims
    }

    drawRoundTextBox( pos: Vector, text: string, options: { padding?: number, textColor?: string, boxColor?: string, alignX?: TextAlignX, alignY?: TextAlignY, borderRadius?: number } ) {
        let padding = options.padding ?? 1
        let textColor = options.textColor ?? "white"
        let boxColor = options.boxColor ?? "black"
        let alignX = options.alignX ?? TextAlignX.left
        let alignY = options.alignY ?? TextAlignY.top
        let borderRadius = options.borderRadius ?? 0

        let metrics = this.c.measureText( text )

        let p = padding, p2 = padding * 2
        let textDims = new Vector( metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent )
        let textBoxDims = textDims.addXY( p2, p2 )
        let textBoxOffset = pos.addXY( -textBoxDims.x * alignX, -textBoxDims.y * alignY )
        let textOffset = textBoxOffset.addXY( p, p + metrics.actualBoundingBoxAscent )
        this.drawRoundRect( textBoxOffset, textBoxDims, boxColor, borderRadius )
        this.drawText( textOffset, text, textColor )

        return textBoxDims
    }
    drawSheetFrame( img: HTMLImageElement, frameHeight: number, x: number, y: number, frame: number ) {
        let w = img.width
        let h = frameHeight
        this.c.drawImage( img, 0, h * frame, w, h, x, y, w, h )
    }
}

export enum TextAlignX { left = 0, center = .5, right = 1 }
export enum TextAlignY { top = 0, center = .5, bottom = 1 }