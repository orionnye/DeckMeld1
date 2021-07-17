import { Vector } from "./math/Vector"
import Matrix from "./math/Matrix"
import World from './gameobjects/World'
import Input from "./common/Input"
import Graphics, { TextAlignX } from "./Graphics"
import "./GlobalTypes"
import UnitTray from './gameobjects/UnitTray'
import { PickingResult, SceneNode } from "./Scene"
import Scene from "./Scene"
import CardTray from "./gameobjects/CardTray"
import Camera from "./gameobjects/Camera"
import Clock from "./common/Clock"
import Unit from "./gameobjects/Unit"
import content from "*.css"

type Team = { name: string, flipUnits: boolean }

export default class Game {
    static instance: Game
    static uiScale = 3
    static camVelocityDecay = 0.85
    graphics = new Graphics()
    camera = new Camera()
    input = new Input()
    scene: SceneNode = { localMatrix: Matrix.scale( Game.uiScale, Game.uiScale ) }
    mouseOverData: PickingResult = { node: undefined, point: Vector.zero }

    world = new World()
    unitTray = new UnitTray()
    cardTray = new CardTray()

    showSceneDebug = false
    showFPS = false
    clock = new Clock()

    teams: Team[] = [
        { name: "Drunken Scholars", flipUnits: false },
        { name: "Choden Warriors", flipUnits: true }
    ]
    turn = 0

    constructor() {
        Game.instance = this
        window.addEventListener( "click", ev => this.onClick( ev ) )
        window.addEventListener( "mousedown", ev => this.onMousedown( ev ) )
        window.addEventListener( "mouseup", ev => this.onMouseup( ev ) )
        window.addEventListener( "wheel", ev => this.onWheel( ev ) )
        window.addEventListener( "resize", ev => this.graphics.onResize() )
        window.addEventListener( "keyup", ev => this.onKeyup( ev ) )
        this.moveCamToFirstUnit()
    }

    // Model
    playerUnits() { return this.world.units.filter( unit => unit.teamNumber == this.turn ) }
    selectedUnit() { return this.unitTray.selectedUnit() }
    selectedCard() { return this.cardTray.selectedCard() }
    isPickingTarget() { return this.cardTray.isPickingTarget }
    onSelectUnit() {
        this.cardTray.onSelectUnit()
        let selectedUnit = this.selectedUnit()
        if ( selectedUnit )
            this.moveCamToUnit( selectedUnit )
    }
    moveCamToUnit( unit: Unit ) { this.camera.setCameraTarget( unit.pos.addXY( .5, .5 ).scale( World.tileSize ) ) }
    moveCamToFirstUnit() {
        let units = this.playerUnits()
        if ( units.length == 0 ) return
        this.moveCamToUnit( units[ 0 ] )
    }
    goBack() {
        let { unitTray, cardTray } = this
        if ( cardTray.isPickingTarget )
            cardTray.deselect()
        else
            unitTray.deselect()
    }
    applyCardAt( pos: Vector ) {
        let unit = this.selectedUnit()
        let card = this.selectedCard()
        this.cardTray.deselect()
        if ( unit && card ) {
            let index = unit.hand.indexOf( card )
            if ( index < 0 )
                throw new Error( "Selected card is not in selected unit's hand." )
            unit.hand.splice( index, 1 )
            unit.discard.push( card )
            let world = this.world
            card.apply( unit, pos, world.getUnit( pos ) )
        }
    }
    endTurn() {
        this.turn++
        this.turn %= this.teams.length
        for ( let unit of this.world.units ) {
            unit.onEndTurn()
        }
        this.unitTray.deselect()
        this.moveCamToFirstUnit()
    }
    update() {
        this.clock.nextFrame()
        this.world.update()
        this.cardTray.update()
        this.makeSceneNode()
        this.camera.update()
        this.mouseOverData = Scene.pick( this.scene, this.input.cursor )
        let { node, point } = this.mouseOverData
        if ( node?.onHover )
            node.onHover( node, point )
    }

    // Controls
    onClick( ev: MouseEvent ) {
        let cursor = this.input.cursor
        let { node, point } = Scene.pick( this.scene, cursor )
        if ( node && !this.input.keys.get( "shift" ) ) {
            if ( node.onClick )
                node.onClick( node, point )
        }
    }
    onMousedown( ev: MouseEvent ) {
        let button = ev.button
        let leftClick = button == 0
        let middleClick = button == 1
        let rightClick = button == 2
        if ( leftClick || middleClick ) {
            let cursor = this.input.cursor
            let node = Scene.pickNode( this.scene, cursor )
            let worldClicked = node == this.world.scene
            let nothingClicked = node == undefined
            let unitSelected = this.unitTray.selectedUnit() !== undefined
            let isMovingUnit = unitSelected && !this.isPickingTarget()
            let canLeftClickDrag = ( ( worldClicked || nothingClicked ) && !isMovingUnit ) || this.input.keys.get( "shift" )
            if ( canLeftClickDrag || middleClick )
                this.camera.startDragging()
        } else if ( rightClick ) {
            this.goBack()
        }
    }
    onMouseup( ev: MouseEvent ) {
        this.camera.stopDragging()
    }
    onWheel( ev: WheelEvent ) {
        this.camera.onWheel( ev )
    }
    onKeyup( ev: KeyboardEvent ) {
        this.camera.onKeyup( ev )
        if ( ev.key == "`" )
            this.showSceneDebug = !this.showSceneDebug
        if ( ev.key == "," )
            this.showFPS = !this.showFPS
        if ( ev.key == "Escape" )
            this.goBack()
        if ( ev.key == "Enter" ) {
            this.endTurn()
        }
    }

    // View
    render() {
        let g = this.graphics
        g.c.imageSmoothingEnabled = false
        g.c.fillStyle = "#5fb2de"
        g.c.fillRect( 0, 0, g.size.x, g.size.y )
        g.c.textBaseline = "top"
        let picked = Scene.pickNode( this.scene, this.input.cursor )
        if ( this.showSceneDebug ) {
            if ( picked ) picked.color = "white"
            Scene.render( g.c, this.scene, true )
            g.setFont( 12, "pixel" )
            g.drawText( this.input.cursor.add( Vector.one.scale( 20 ) ), picked?.description ?? "", "white" )
        } else {
            Scene.render( g.c, this.scene, false )
        }
        if ( this.showFPS ) {
            g.setFont( 24, "impact" )
            g.drawText( Vector.one.scale( 2 ), this.clock.averageFPS.toFixed( 2 ), "red" )
        }
    }
    makeSceneNode() {
        let g = Graphics.instance
        let { world, unitTray, cardTray } = this
        let selectedUnit = this.selectedUnit()
        this.scene = Scene.node( {
            localMatrix: Matrix.scale( Game.uiScale, Game.uiScale ),
            onRenderPost: () => {
                let center = this.screenCenter()
                g.setFont( 6, "pixel" )
                g.drawTextBox( new Vector( center.x, 0 ), this.teams[ this.turn ].name, { textColor: "#c2c2c2", boxColor: "#696969", alignX: TextAlignX.center } )
            },
            content: () => {
                world.makeSceneNode()
                unitTray.makeSceneNode()
                if ( selectedUnit )
                    cardTray.makeSceneNode()
            }
        } )
    }
    cameraTransform() {
        let screenDims = this.screenDimensions()
        return this.camera.worldToCamera( screenDims.x, screenDims.y )
    }
    screenDimensions() { return this.graphics.size.scale( 1 / Game.uiScale ) }
    screenCenter() { return this.graphics.size.scale( 0.5 / Game.uiScale ) }
}