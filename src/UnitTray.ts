import Graphics from "./Graphics"
import Game from "./Game"
import { Vector } from "./math/Vector"
import Unit from "./Unit"
import World from "./World"
import Matrix from "./math/Matrix"
import { SceneNode } from "./scene/Scene"

export default class UnitTray {
    private index = 0
    private hasUnitSelected = false

    constructor() {
        window.addEventListener( "keydown", ( ev ) => {
            if ( ev.key == "Tab" ) {
                ev.preventDefault()
                this.cycleUnits()
            }
            if ( ev.key == "Escape" ) {
                this.deselectUnit()
            }
        } )
    }

    setUnitIndex( index: number ) {
        this.hasUnitSelected = true
        this.index = index
        let selectedUnit = this.getSelectedUnit()
        if ( selectedUnit )
            Game.instance.setCameraTarget( selectedUnit.pos.addXY(.5, .5).scale( World.tileSize ) )
    }

    toggleSelectIndex( index: number ) {
        if ( this.hasUnitSelected && index == this.index )
            this.deselectUnit()
        else
            this.setUnitIndex( index )
    }

    deselectUnit() {
        this.hasUnitSelected = false
    }

    numberOfUnits() {
        return Game.instance.playerUnits().length
    }

    private cycleUnits() {
        if (!this.hasUnitSelected)
            this.setUnitIndex(0)
        else
            this.setUnitIndex( ( this.index + 1 ) % this.numberOfUnits() )
    }

    selectUnit( unit: Unit ) {
        let units = Game.instance.playerUnits()
        let index = units.indexOf( unit )
        if ( index > -1 ) {
            this.setUnitIndex( index )
        }
    }

    getSelectedUnit() {
        let units = Game.instance.playerUnits()
        if ( !this.hasUnitSelected ) return null
        return units[ this.index ]
    }

    makeSceneNode(): SceneNode {
        let game = Game.instance
        let units = game.playerUnits()
        let selectedUnit = this.getSelectedUnit()
        let g = Graphics.instance
        const unitTrayStride = World.tileSize + 1
        let width = World.tileSize
        let height = unitTrayStride * this.numberOfUnits()
        return {
            description: "unit-tray",
            localMatrix: Matrix.translation(0, 32),
            rect: { width, height },
            onRender: () => g.drawRect(new Vector(-1, -1), new Vector(width + 2, height + 1), "#595959"),
            children: units.map(
                ( unit, i ) => {
                    return {
                        description: "tray-unit",
                        localMatrix: Matrix.translation( 0, unitTrayStride * i ),
                        rect: { width: World.tileSize, height: World.tileSize },
                        color: "blue",
                        onClick: () => this.toggleSelectIndex( i ),
                        onRender: () => {
                            unit.render( Vector.zero )
                            if ( selectedUnit == unit ) {
                                g.c.lineWidth = 1
                                g.c.strokeStyle = "red"
                                g.c.strokeRect( .5, .5, 31, 31 )
                                g.c.stroke()
                            }
                        }
                    }
                }
            )
        }
    }

}