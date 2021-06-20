import { Vector } from "./math/Vector";
import Matrix from "./math/Matrix";
import World from './World';
import Input from "./input";
import Graphics from "./Graphics";
import "./GlobalTypes";
import UnitTray from './UnitTray';
import { getImg } from "./utils";
import Card from './Card';
import { ParentSceneNode } from "./scene/Scene";
import Scene from "./scene/Scene";

const UIImg = getImg( require( "../www/images/UI.png" ) )

export default class Game {
    static instance: Game

    static uiScale = 3 // Size of one "pixel" in screen pixels.

    graphics = new Graphics()
    input = new Input()

    scene: ParentSceneNode = {
        transform: Matrix.scale( Game.uiScale, Game.uiScale ),
        children: []
    }

    world = new World()
    unitTray = new UnitTray()

    camPos = new Vector( 0, 0 ) // in ui space
    camVelocity = new Vector( 0, 0 )
    camTarget: Vector | null = null
    static minSeekDistance = World.tileSize * 18 / Game.uiScale

    debug = false

    constructor() {
        Game.instance = this
        window.addEventListener( "click", ( ev ) => this.onClick() )
        window.addEventListener( "resize", ( ev ) => this.graphics.onResize() )
        window.addEventListener( "keydown", ( ev ) => {
            if ( ev.key == "`" )
                this.debug = !this.debug
        } )
    }

    setCameraTarget( pos: Vector ) {
        let halfScreenDims = this.graphics.size.scale( 0.5 / Game.uiScale ) // in ui space
        let adjustedTarget = pos.subtract( halfScreenDims )
        if ( adjustedTarget.distance( this.camPos ) < Game.minSeekDistance )
            return
        this.camTarget = pos.subtract( halfScreenDims )
    }

    pixelSpaceToWorldSpace( pos: Vector ) {
        return pos.scale( 1 / Game.uiScale ).add( this.camPos ).scale( 1 / World.tileSize )
    }

    pixelSpaceToUISpace( pos: Vector ) {
        return pos.scale( 1 / Game.uiScale )
    }

    worldSpaceToUISpace( pos: Vector ) {
        return pos.scale( World.tileSize ).subtract( this.camPos )
    }

    worldCursor() {
        return this.pixelSpaceToWorldSpace( this.input.cursor )
    }

    UICursor() {
        return this.pixelSpaceToUISpace( this.input.cursor )
    }

    onClick() {
        let { node, point } = Scene.pick( this.scene, this.input.cursor )
        if ( node ) {
            if ( node.onClick )
                node.onClick( point )
        }
    }

    update() {
        let { input, camVelocity, camPos } = this

        if ( input.keys.get( "w" ) ) {
            camVelocity.y += -1
            this.camTarget = null
        }
        if ( input.keys.get( "s" ) ) {
            camVelocity.y += 1
            this.camTarget = null
        }
        if ( input.keys.get( "a" ) ) {
            camVelocity.x += -1
            this.camTarget = null
        }
        if ( input.keys.get( "d" ) ) {
            camVelocity.x += 1
            this.camTarget = null
        }

        this.camPos = camPos.add( camVelocity )
        this.camVelocity = camVelocity.scale( 0.85 )
        if ( camVelocity.length < 0.5 ) {
            camVelocity = new Vector( 0, 0 )
            camPos.x |= 0
            camPos.y |= 0
        }

        if ( this.camTarget ) {
            this.camVelocity = this.camPos.lerp( this.camTarget, 0.075 ).subtract( this.camPos )
            if ( camPos.subtract( this.camTarget ).length < Game.minSeekDistance )
                this.camTarget = null
        }

        this.buildScene()
    }

    render() {
        let grunitSize = Game.uiScale
        let { graphics, camPos, world, unitTray } = this
        let { c } = graphics

        c.fillStyle = "#5fb2de"
        c.beginPath()
        c.fillRect( 0, 0, graphics.size.x, graphics.size.y )

        c.save()

        c.scale( grunitSize, grunitSize )
        c.imageSmoothingEnabled = false

        c.save()
        c.translate( -camPos.x, -camPos.y )
        world.render()
        c.restore()

        graphics.c.drawImage( UIImg, 0, 0 )
        unitTray.render()

        let selectedUnit = unitTray.getSelectedUnit()
        if ( selectedUnit )
            selectedUnit.renderCards()

        c.restore()

        if ( this.debug ) {
            c.globalAlpha = 0.25
            let picked = Scene.pickNode( this.scene, this.input.cursor )
            if ( picked ) picked.color = "white"
            Scene.render( c, this.scene )
            c.globalAlpha = 1
        }
    }

    buildScene() {
        this.scene.children.length = 0
        this.world.addSceneNodes( this.scene )
        this.unitTray.addSceneNodes( this.scene )
    }
}