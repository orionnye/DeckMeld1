import Unit from "./Unit";
import Grid from "./Grid";
import Graphics from "./Graphics";
import { Vector } from "./math";
import { findPath } from "./pathfinding";
import Game from "./Game";

import ashyTileSrc from "../www/images/AshyTileV2.png";
const ashyTileImg = new Image();
ashyTileImg.src = ashyTileSrc;

import hillTileSrc from "../www/images/tiles/flat/hill5.png";
const hillTileImg = new Image();
hillTileImg.src = hillTileSrc;

import grassTileSrc from "../www/images/tiles/flat/grass.png"
const grassTileImg = new Image();
grassTileImg.src = grassTileSrc;

export default class World {

    map: Grid
    units: Unit[]

    static tileSize = 32;
    static tileDimensions = new Vector( World.tileSize, World.tileSize )

    constructor() {
        this.map = new Grid( 10, 10 )
        this.units = [
            new Unit( new Vector( 0, 0 ) ),
            new Unit( new Vector( 1, 1 ) ),
            new Unit( new Vector( 8, 9 ) ),
            new Unit( new Vector( 7, 8 ) ),
        ]

        let randomTerrain = true;
        if ( randomTerrain ) {
            this.map.randomize( 0.3 )
            for ( let unit of this.units )
                this.map.set( unit.pos, 0 )
        } else {
            //custom map
            this.map.setBlock( new Vector( 2, 2 ), new Vector( 4, 4 ), 1 );
            this.map.setBlock( new Vector( 3, 3 ), new Vector( 2, 2 ), 0 );
            this.map.set( new Vector( 3, 2 ), 0 )
            this.map.set( new Vector( 4, 5 ), 0 )
        }
    }

    onClick( cursor: Vector, game: Game ) {
        let cell = cursor.floor()
        let selectedUnit = game.ui.getSelectedUnit( this )
        for ( let unit of this.units ) {
            if ( unit.pos.equals( cell ) ) {
                console.log( unit )
                if ( unit == selectedUnit )
                    game.ui.deselectUnit()
                else
                    game.ui.selectUnit( this, unit )
                return
            }
        }
        if ( selectedUnit ) {
            let path = findPath( this, selectedUnit.pos, cell, 100 )
            if ( path )
                selectedUnit.pos = cell
        }
    }

    isWalkable( pos: Vector ) {
        for ( let unit of this.units )
            if ( unit.pos.equals( pos ) )
                return false
        return this.map.contains( pos ) && this.map.isEmpty( pos )
    }

    render( g: Graphics, game: Game ) {
        let tileSize = World.tileSize

        let cursor = game.worldCursor().floor()
        let selectedUnit = game.ui.getSelectedUnit( this )
        let cursorWalkable = this.isWalkable( cursor )

        this.drawMap( g )

        //  Draw unit path
        if ( cursorWalkable && selectedUnit != undefined ) {
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

        for ( let unit of this.units ) {
            g.c.save()
            if ( unit == selectedUnit ) {
                g.c.shadowBlur = 10
                g.c.shadowColor = "black"
            }
            unit.render( g, unit.pos.scale( tileSize ) )
            g.c.restore()
        }
    }

    drawMap( g: Graphics, numbered: boolean = false ) {
        let map = this.map
        let tileSize = World.tileSize
        let tileDimensions = World.tileDimensions
        for ( let y = 0; y < map.height; y++ ) {
            for ( let x = 0; x < map.width; x++ ) {
                let currentPos = new Vector( x * tileSize, y * tileSize )
                let tile = map.getFromXY( x, y )
                //default square
                if ( tile.content == map.wall ) {
                    // cv.drawRect( currentPos, tileDimensions, "grey" );
                    g.c.drawImage( hillTileImg, currentPos.x, currentPos.y )
                } else {
                    g.c.drawImage( grassTileImg, currentPos.x, currentPos.y )
                }
                // cv.strokeRect( currentPos, tileDimensions );
                if ( numbered ) {
                    let textPos = new Vector( x * tileSize + 1, y * tileSize + 1 )
                    let currentText = x.toString() + ", " + y.toString()
                    g.drawText( textPos, ( tileSize / 8 ) | 0, currentText )
                }
            }
        }
    }
}