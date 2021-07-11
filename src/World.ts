import Unit from "./Unit"
import Grid from "./Grid"
import Graphics from "./Graphics"
import { Vector } from "./math/Vector"
import { findPath } from "./pathfinding"
import Game from "./Game"
import { getImg } from "./utils"
import Matrix from "./math/Matrix"
import Scene, { SceneNode } from "./scene/Scene"

const hillTileImg = getImg( require( "../www/images/tiles/flat/hill5.png" ) )
const grassTileImg = getImg( require( "../www/images/tiles/flat/grass.png" ) )

export default class World {
    static tileSize = 32
    map: Grid
    units: Unit[]
    scene: SceneNode = { localMatrix: Matrix.identity }

    constructor() {
        this.map = new Grid( 10, 10 )
        this.units = [
            new Unit( new Vector( 1, 1 ) ),
            new Unit( new Vector( 2, 2 ) ),
            new Unit( new Vector( 7, 7 ) ),
            new Unit( new Vector( 8, 8 ) ),
        ]

        let randomTerrain = true
        if ( randomTerrain ) {
            this.map.randomize( 0.3 )
            for ( let unit of this.units ) {
                this.map.set( unit.pos, 0 )
            }
        } else {
            //custom map
            this.map.fillRect( new Vector( 3, 3 ), new Vector( 4, 4 ), 1 )
            this.map.fillRect( new Vector( 4, 4 ), new Vector( 2, 2 ), 0 )
            this.map.set( new Vector( 4, 3 ), 0 )
            this.map.set( new Vector( 5, 6 ), 0 )
        }
    }

    isWalkable( pos: Vector ) {
        for ( let unit of this.units )
            if ( unit.pos.equals( pos ) )
                return false
        return this.map.contains( pos ) && this.map.isEmpty( pos )
    }

    hasFocus() {
        return Game.instance.mouseOverData.node?.description == "world"
    }

    tileSpaceCursor() {
        let cursor = Game.instance.input.cursor
        return Scene.toLocalSpace( cursor, this.scene ).scale( 1 / World.tileSize ).floor()
    }

    render() {
        let g = Graphics.instance
        let tileSize = World.tileSize

        let cursor = this.tileSpaceCursor()
        let selectedUnit = Game.instance.unitTray.getSelectedUnit()
        let cursorWalkable = this.isWalkable( cursor )

        this.drawMap()

        //  Draw unit path
        if ( this.hasFocus() && cursorWalkable && selectedUnit != undefined ) {
            let path = findPath( this, selectedUnit.pos, cursor, 100 )
            if ( path ) {
                let radius = 3
                g.c.save()
                g.makePath( path.map( x => x.add( Vector.one.scale( 0.5 ) ).scale( tileSize ) ) )
                g.c.strokeStyle = "#f0ead8"
                g.c.lineWidth = radius
                g.c.stroke()
                g.c.beginPath()
                let endpoint = cursor.add( Vector.one.scale( 0.5 ) ).scale( tileSize )
                g.c.fillStyle = "#f0ead8"
                g.c.fillRect( endpoint.x - radius, endpoint.y - radius, radius * 2, radius * 2 )
                g.c.restore()
            }
        }
    }

    drawMap( numbered: boolean = false ) {
        let g = Graphics.instance
        let map = this.map
        let tileSize = World.tileSize
        for ( let y = 0; y < map.height; y++ ) {
            for ( let x = 0; x < map.width; x++ ) {
                let currentPos = new Vector( x * tileSize, y * tileSize )
                let tile = map.getFromXY( x, y )
                if ( tile.content == map.wall ) {
                    g.c.drawImage( hillTileImg, currentPos.x, currentPos.y )
                } else {
                    g.c.drawImage( grassTileImg, currentPos.x, currentPos.y )
                }
                if ( numbered ) {
                    let textPos = new Vector( x * tileSize + 1, y * tileSize + 1 )
                    let currentText = x.toString() + ", " + y.toString()
                    g.drawText( textPos, ( tileSize / 8 ) | 0, currentText, "#f0ead8" )
                }
            }
        }
    }

    makeSceneNode(): SceneNode {
        let game = Game.instance
        let g = Graphics.instance
        let { camPos } = game
        let { units } = this
        let { width, height } = this.map
        let selectedUnit = Game.instance.unitTray.getSelectedUnit()
        let tileSize = World.tileSize

        let { startNode, endNode } = Scene
        startNode( {
            description: "world",
            color: "yellow",
            localMatrix: Matrix.vTranslation( camPos.scale( -1 ) ),
            rect: {
                width: width * tileSize,
                height: height * tileSize,
            },
            onClick: ( node, pos: Vector ) => {
                if ( selectedUnit ) {
                    let cell = pos.scale( 1 / tileSize ).floor()
                    let path = findPath( this, selectedUnit.pos, cell, 100 )
                    if ( path )
                        selectedUnit.pos = cell
                }
            },
            onRender: () => this.render()
        } )
        units.forEach( ( unit, i ) => {
            startNode( {
                description: "unit",
                color: "red",
                localMatrix: Matrix.vTranslation( unit.pos.scale( tileSize ) ),
                rect: { width: tileSize, height: tileSize },
                onClick: () => game.unitTray.toggleSelectIndex( i ),
                onRender: () => {
                    if ( unit == selectedUnit ) {
                        g.c.shadowBlur = 10
                        g.c.shadowColor = "black"
                    }
                    unit.render( Vector.zero )
                }
            } )
            endNode()
        } )
        this.scene = endNode() as SceneNode
        return this.scene
    }
}