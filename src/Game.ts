import { Vector } from "./math/Vector"
import Matrix from "./math/Matrix"
import World from './map/World'
import Input from "./common/Input"
import Graphics, { TextAlignX } from "./common/Graphics"
import "./common/GlobalTypes"
import { PickingResult, SceneNode } from "./common/Scene"
import Scene from "./common/Scene"
import Camera from "./gameobjects/Camera"
import Clock from "./common/Clock"
import Unit from "./gameobjects/mech/Unit"
import content from "*.css"
import AI from "./common/AI"
import CardTypes from "./gameobjects/card/CardTypes"
import CardTray from "./gameobjects/ui/CardTray"
import Team from "./gameobjects/mech/Team"
import { Chrome, Earth, Flesh, Treant } from "./gameobjects/mech/RigTypes"
const vacationurl = require( './www/audio/Vacation.mp3' )
let vacation = new Audio( vacationurl )
const knockurl = require( './www/audio/Knock.mp3' )
let knock = new Audio( knockurl )

export default class Game {
    static instance: Game
    static uiScale = 3
    static camVelocityDecay = 0.85
    graphics = new Graphics()
    camera = new Camera()
    input = new Input()
    scene: SceneNode = { localMatrix: Matrix.scale( Game.uiScale, Game.uiScale ) }
    mouseOverData: PickingResult = { node: undefined, point: Vector.zero }
    world : World
    
    showSceneDebug = false
    showFPS = false
    clock = new Clock()

    isPlayerDone = false

    constructor() {
        let playerTeam = new Team("Drunken Scholars", false, 0)
        playerTeam.units = [
            new Chrome(new Vector(1, 0), 0),
            new Flesh(new Vector(1, 0), 0),
            new Treant(new Vector(1, 0), 0),
            new Earth(new Vector(2, 0), 0)
        ]
        this.world = new World(playerTeam)
        Game.instance = this
        window.addEventListener( "click", ev => this.onClick( ev ) )
        window.addEventListener( "mousedown", ev => this.onMousedown( ev ) )
        window.addEventListener( "mouseup", ev => this.onMouseup( ev ) )
        window.addEventListener( "wheel", ev => this.onWheel( ev ) )
        window.addEventListener( "resize", ev => this.graphics.onResize() )
        window.addEventListener( "keyup", ev => this.onKeyup( ev ) )
        this.moveCamToFirstUnit()
    }

    //----------------MODEL------------------
    moveCamToUnit( unit: Unit ) { this.camera.setCameraTarget( unit.pos.addXY( .5, .5 ).scale( World.tileSize ) ) }
    moveCamToFirstUnit() {
        let units = this.world.activeTeam().units
        if ( units.length == 0 ) return
        this.moveCamToUnit( units[ 0 ] )
    }
    //----------------------UPDATE----------------------------
    update() {
        this.clock.nextFrame()

        this.world.update()
        this.makeSceneNode()
        this.camera.update()

        //user Input Display
        this.mouseOverData = Scene.pick( this.scene, this.input.cursor )
        let { node, point } = this.mouseOverData
        if ( node?.onHover )
        node.onHover( node, point )
    }

    //---------------------------User Input---------------------------
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
            let unitSelected = this.world.activeTeam().selectedUnit() !== undefined
            // let isMovingUnit = unitSelected && !this.isPickingTarget()
            let isMovingUnit = unitSelected
            let canLeftClickDrag = ( ( worldClicked || nothingClicked ) && !isMovingUnit ) || this.input.keys.get( "shift" )
            if ( canLeftClickDrag || middleClick )
                this.camera.startDragging()
        } else if ( rightClick ) {
            this.world.goBack()
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
        // if ( ev.key == "Escape" )
        //     this.goBack()
        if ( ev.key == "q" ) {
            // console.log("trying to cycleUnits")
            // ev.preventDefault()
            this.world.activeTeam().cycleUnits()
            if (this.world.activeTeam().selectedUnit() !== undefined) {
                this.moveCamToUnit(this.world.activeTeam().selectedUnit()!)
            }
        }
        if ( ev.key == "Enter" ) {
            //stops you from skipping enemies turn
            // if (!this.isAITurn()) {
                // console.log("ending turn")
                this.world.endTurn()
                this.moveCamToFirstUnit()
            // }
        }
    }

    //--------------------------RENDER-----------------------------
    render() {
        let g = this.graphics
        g.c.imageSmoothingEnabled = false
        g.c.fillStyle = "#2b69f5"
        g.c.fillRect( 0, 0, g.size.x, g.size.y )
        g.c.textBaseline = "top"
        let picked = Scene.pickNode( this.scene, this.input.cursor )
        if ( this.showSceneDebug ) {
            if ( picked ) picked.debugColor = "white"
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
        let { world } = this
        let { unitTray, cardTray } = this.world
        let selectedUnit = this.world.activeTeam().selectedUnit()
        this.scene = Scene.node( {
            localMatrix: Matrix.scale( Game.uiScale, Game.uiScale ),
            onRenderPost: () => {
                //TEAM NAME DISPLAY
                let center = Game.instance.screenCenter()
                g.setFont( 6, "pixel" )
                g.drawTextBox( new Vector( center.x, 0 ), this.world.activeTeam().name, {
                    textColor: "#c2c2c2", boxColor: "#6969698f", alignX: TextAlignX.center
                } )
            },
            content: () => {
                world.makeSceneNode()
                if (this.world.turn == 0) {
                    world.unitTray.makeSceneNode(Vector.zero, world.activeTeam())
                } else {
                    world.unitTray.makeSceneNode(new Vector(-this.screenDimensions().x+World.tileSize, 0), world.activeTeam(), true)
                }
                if ( selectedUnit )
                    cardTray.makeSceneNode( selectedUnit )
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