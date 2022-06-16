import { getImg } from "../../common/utils"
import Game from "../../Game"
import Unit from "../mech/Unit"
import Match from "../../stages/Match"
import { Vector } from "../../math/Vector"
import { findPath } from "../map/pathfinding"
import * as Tiles from "../map/Tiles"
import Card from "./Card"
import Graphics from "../../common/Graphics"
import { randomFloor } from "../../math/math"
//I have no idea why this requires one period but it does
//Ores
const ore = getImg( require( "../../www/images/cards/ore/pustule.png" ) )

//Action Icons
const blank = getImg( require( "../../www/images/cards/backing/card.png" ) )

const laser = getImg( require( "../../www/images/cards/icon/laser.png" ) )
const energyArmor = getImg( require( "../../www/images/cards/icon/energyArmor.png" ) )
const shieldCharge = getImg( require( "../../www/images/cards/icon/shieldCharge.png" ) )
const energyFist = getImg( require( "../../www/images/cards/icon/energyFist.png" ) )
// const chargeBeam = getImg( require( "../../www/images/cards/icon/chargeBeam.png" ) )

const boulder = getImg( require( "../../www/images/cards/icon/boulder.png" ) )
const mine = getImg( require( "../../www/images/cards/icon/mine.png" ) )
const gorge = getImg( require( "../../www/images/cards/icon/gorge.png" ) )
const blastCharge = getImg( require( "../../www/images/cards/icon/blastCharge.png" ) )
const dynamite = getImg( require( "../../www/images/cards/icon/dynamite.png" ) )


const claw = getImg( require( "../../www/images/cards/icon/claw.png" ) )
const frendzi = getImg( require( "../../www/images/cards/icon/frendzi.png" ) )
const lump = getImg( require( "../../www/images/cards/icon/lump.png" ) )
const leap = getImg( require( "../../www/images/cards/icon/leap.png" ) )
const chomp = getImg( require( "../../www/images/cards/icon/chomp.png" ) )

const sprint = getImg( require( "../../www/images/cards/icon/sprint.png" ) )
const repair = getImg( require( "../../www/images/cards/icon/repair.png" ) )
const grapplingHook = getImg( require( "../../www/images/cards/icon/grapplingHook.png" ) )
const rifle = getImg( require( "../../www/images/cards/icon/gun.png" ) )

const pollen = getImg( require( "../../www/images/cards/icon/pollen.png" ) )
const fungus = getImg( require( "../../www/images/cards/icon/fungus.png" ) )
const fruit = getImg( require( "../../www/images/cards/icon/fruit.png" ) )
const root = getImg( require( "../../www/images/cards/icon/root.png" ) )
const flower = getImg( require( "../../www/images/cards/icon/flower.png" ) )
const boomShroom = getImg( require( "../../www/images/cards/icon/boomShroom.png" ) )

const jelly = getImg( require( "../../www/images/cards/icon/jelly.png" ) )
const acid = getImg( require( "../../www/images/cards/icon/acid.png" ) )
const tentacle = getImg( require( "../../www/images/cards/icon/tentacle.png" ) )
const frost = getImg( require( "../../www/images/cards/icon/frost.png" ) )
const warp = getImg( require( "../../www/images/cards/icon/warp.png" ) )
const worms = getImg( require( "../../www/images/cards/icon/worms.png" ) )


//Card Background
const flesh = getImg( require( "../../www/images/cards/backing/flesh.png" ) )
const black = getImg( require( "../../www/images/cards/backing/BlackCardBase.png" ) )
const brown = getImg( require( "../../www/images/cards/backing/BrownCardBase.png" ) )
const green = getImg( require( "../../www/images/cards/backing/jungle.png" ) )
// const green = getImg( require( "../../www/images/cards/backing/GreenCardBase.png" ) )
const metal = getImg( require( "../../www/images/cards/backing/metal.png" ) )
const purple = getImg( require( "../../www/images/cards/backing/purple.png" ) )

//ANIMATION RENDER Access
const hill = getImg( require( "../../www/images/tiles/flat/hill5.png" ) )
const grass = getImg( require( "../../www/images/tiles/flat/grass.png" ) )

export type CardType = {
    name: string
    getDescription: ( card: Card ) => string
    color: string
    sprite: HTMLImageElement
    backing: HTMLImageElement
    canApplyToEmptyTiles: boolean
    getTilesInRange: ( card: Card, user: Unit ) => Vector[]

    onApplyToTile?: ( card: Card, user: Unit, pos: Vector, target?: Unit ) => void
    getTilesEffected?: ( user: Unit, pos: Vector ) => Vector[]

    render?: ( animationFrame: number, user: Unit, pos: Vector ) => void
    renderFrames?: number,

    cost: number,
    damage: number,
    dim?: Vector,
    range: number,
    minDist: number,
    friendly: boolean,
    playable: boolean,
    exhaustive?: true

    [ index: string ]: any
}

const CardTypes: { [ name: string ]: CardType } = {
    //------------------------------------------------------- CHROME -----------------------------------------------------
    laser: {
        name: "Laser",
        getDescription: card => `Deal ${ card.type.damage } damage, Take 1 damage`,
        color: "#969696",
        sprite: laser,
        backing: metal,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => rookStyleTargets( user.pos, { range: card.type.range } ),
        onApplyToTile: ( card, user, pos, target ) => {
            target?.addHealth( -card.type.damage )
            user.addHealth( -1 )

        },

        render: ( animationFrame, user, pos ) => {
            let g = Graphics.instance
            let game = Game.instance
            let match = game.match
            let tileSize = 32
            let target = match.getUnit( pos )
            if ( target ) {
                let userPos = user.pos.scale( tileSize ).add( new Vector( tileSize / 2, tileSize / 2 ) )
                let targetPos = target.pos.scale( tileSize ).add( new Vector( tileSize / 2, tileSize / 2 ) )

                g.c.strokeStyle = "rgba(255, 0, 0, 1)"
                g.c.lineWidth = Math.cos( animationFrame ) * 20
                g.c.beginPath()
                g.c.moveTo( userPos.x, userPos.y )
                g.c.lineTo( targetPos?.x, targetPos?.y )
                g.c.stroke()
                // console.log("using animation")
            }
        },
        renderFrames: 10,

        cost: 1,
        damage: 6,
        range: 8,
        minDist: 2,

        friendly: false,
        playable: true
    },
    energyArmor: {
        name: "Energy Armor",
        getDescription: card => `Reduce incoming damage by ${ card.type.damage }, Use to draw 1 card`,
        color: "#6BB5FF",
        sprite: energyArmor,
        backing: metal,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            user.drawCard( 1 )
            // user.discard.cards.pop()
        },

        cost: 0,
        damage: 2,
        range: 0,
        minDist: 0,
        friendly: true,
        playable: true,
        exhaustive: true
    },
    shieldCharge: {
        name: "Shield Charge",
        getDescription: card => `Generate ${ card.type.damage } Energy Armor`,
        color: "#6BB5FF",
        sprite: shieldCharge,
        backing: metal,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            user.gainCard( CardTypes.energyArmor, card.type.damage )

        },

        cost: 1,
        damage: 2,
        range: 0,
        minDist: 0,
        friendly: true,
        playable: true
    },
    energyFist: {
        name: "Energy Fist",
        getDescription: card => `Punch Target and knock them back`,
        color: "#6BB5FF",
        sprite: energyFist,
        backing: metal,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            // user.gainCard( CardTypes.energyArmor, card.type.damage )
            console.log("Energy Fist has no effect currently, please build")
        },

        cost: 1,
        damage: 2,
        range: 0,
        minDist: 0,
        friendly: true,
        playable: true
    },
    //------------------------------------------------------- EARTH -----------------------------------------------------
    bouldertoss: {
        name: "Boulder Toss",
        getDescription: card => `Place a Mountain, Deal ${card.type.damage} damage`,
        color: "#b87420",
        sprite: boulder,
        backing: brown,
        canApplyToEmptyTiles: true,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            // console.log(pos)
            let match = Game.instance.match
            match.map.set( pos, Tiles.GrassHill )
            target?.addHealth( -card.type.damage )
        },

        render: ( animationFrame, user, pos ) => {
            // animationFrame = 2 * Math.sin(animationFrame * Math.PI / 2) - 1;
            let g = Graphics.instance
            let game = Game.instance
            let match = game.match
            let tileSize = 32
            let halfTile = new Vector(tileSize/2, tileSize/2)

            //THE BIG LIE
            //rendering an empty tile even though its actually already a mountain
            let endTile = pos.scale(tileSize)
            g.drawSheetFrame(grass, 32, endTile.x, endTile.y, 0)
            let heightBump = new Vector(0, -20)
            let midPos = user.pos.lerp(pos, animationFrame).scale(tileSize).add(heightBump)
            let yCurve = new Vector(0, -Math.sin(animationFrame*Math.PI)*20)
            for ( let i = 0; i < 5; i++ ) {
                let noiseVector = new Vector(Math.sin(i)*8, Math.cos(i)*8)
                let spot = midPos.add(noiseVector).add(yCurve).add(halfTile)
                g.fillCircle(spot, 10, `rgba(${i*15}, 0, 0, 1)`)
            }
        },
        renderFrames: 25,

        cost: 1,
        damage: 3,
        range: 7,
        minDist: 2,

        friendly: false,
        playable: true,

    },
    gorge: {
        name: "Gorge",
        getDescription: card => `Place ${ card.type.dim!.x }x${ card.type.dim!.y } Mountains`,
        color: "#b87420",
        sprite: gorge,
        backing: brown,
        canApplyToEmptyTiles: true,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            let match = Game.instance.match
            match.map.set( pos, Tiles.GrassHill )
        },
        getTilesEffected( user, pos ) {
            let match = Game.instance.match
            let tilesEffected: Vector[] = [ pos ]
            let dim = this.dim!
            //get relative direction from user
            for ( let x = 0; x < dim.x; x++ ) {
                for ( let y = 0; y < dim.y; y++ ) {
                    let tile = pos.add( new Vector( x - 1, y - 1 ) )
                    if ( !tile.equals( pos ) ) {
                        tilesEffected.push( tile )
                    }
                }
            }
            return tilesEffected
        },

        render: ( animationFrame, user, pos ) => {
            let g = Graphics.instance
            let game = Game.instance
            let tileSize = 32
            let tiles = CardTypes.gorge.getTilesEffected!( user, pos )

            tiles.forEach( tile => {
                //THE BIG LIE
                //rendering an empty tile even though its actually already a mountain
                let endTile = tile.scale( tileSize )
                g.drawSheetFrame( grass, 32, endTile.x, endTile.y, 0 )
            } )
            tiles.forEach( tile => {
                //The big ball movement
                let halfTile = new Vector( tileSize / 2, tileSize / 2 )
                let midPos = user.pos.lerp( tile, animationFrame ).scale( tileSize )
                let yCurve = new Vector( 0, -Math.sin( animationFrame * Math.PI ) * 20 )
                for ( let i = 0; i < 5; i++ ) {
                    let noiseVector = new Vector( Math.sin( i ) * 8, Math.cos( i ) * 8 )
                    let spot = midPos.add( noiseVector ).add( yCurve ).add( halfTile )
                    g.fillCircle( spot, 10, `rgba(${ i * 15 }, 0, 0, 1)` )
                }
            } )
        },
        renderFrames: 25,


        cost: 1,
        damage: 0,
        dim: new Vector( 3, 3 ),
        range: 6,
        minDist: 4,
        friendly: false,
        playable: true,

    },
    mine: {
        name: "Mine",
        getDescription: card => `Destroy Mountain, Deal ${ card.type.damage } damage, Gain 1 FUEL`,
        color: "#b87420",
        sprite: mine,
        backing: brown,
        canApplyToEmptyTiles: true,
        getTilesInRange: ( card, user ) => rookStyleTargets( user.pos, { range: card.type.range, ignoreObstacles: true, ignoreElevation: true } ),
        onApplyToTile: ( card, user, pos, target ) => {
            // console.log(pos)
            let match = Game.instance.match
            // console.log(match.map.get(pos))
            if ( match.map.get( pos ) == Tiles.GrassHill ) {
                match.map.set( pos, Tiles.Grass )
                // for ( let i = 0; i < 1; i++ ) {
                let card = new Card()
                card.type = CardTypes.fuel
                user.draw.cards.push( card )
                // }
            }
            target?.addHealth( -card.type.damage )

        },

        cost: 1,
        damage: 6,
        range: 1,
        minDist: 1,
        friendly: false,
        playable: true,

    },
    fuel: {
        name: "Fuel",
        getDescription: card => `Gain ${card.type.damage} energy -Exhaustive`,
        color: "#aaaaaa",
        sprite: ore,
        backing: black,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            //Exhaustive
            //look for the card in the users Discard Pile and remove it
            target?.addEnergy( card.type.damage )
            user?.addEnergy( -card.type.cost )
            user.discard.cards.pop()
        },

        cost: 0,
        damage: 1,
        range: 1,
        minDist: 0,
        friendly: true,
        playable: true,
        exhaustive: true
    },
    blastCharge: {
        name: "Blast Charge",
        getDescription: card => `Charge through a line of Mountains`,
        color: "#b87420",
        sprite: blastCharge,
        backing: brown,
        canApplyToEmptyTiles: true,
        getTilesInRange: ( card, user ) => rookStyleTargets( user.pos, {
            range: card.type.range,
            ignoreObstacles: false,
            ignoreElevation: false,
            passable: (pos: Vector) => {
                // if (Game.instance.match.map.getElevation(pos) < 0) {
                //     return false
                // } else {
                //     return true
                // }
                return true
            }
        } ),
        // getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        getTilesEffected( user, pos ) {
            let match = Game.instance.match
            let tilesEffected: Vector[] = [ pos ]
            let dim = this.dim!
            //get relative direction from user
            let direction = user.pos.subtract(pos)
            for ( let i = 0; i < direction.length; i++ ) {
                let step = direction.unit()
                let tile = user.pos.subtract(step.scale(i))
                tile = new Vector(Math.round(tile.x), Math.round(tile.y))
                if ( !tile.equals( user.pos ) && match.map.contains(tile) ) {
                    tilesEffected.push( tile )
                }
            }
            return tilesEffected
        },
        onApplyToTile: ( card, user, pos, target ) => {
            // console.log(pos)
            let match = Game.instance.match
            // console.log(match.map.get(pos))
            if ( match.map.get( pos ) == Tiles.GrassHill ) {
                match.map.set( pos, Tiles.Grass )
            }
            if (target) {
                if (target !== user) {
                    target?.addHealth( -card.type.damage )
                }
            }
            user.pos = pos
        },

        cost: 1,
        damage: 3,
        range: 5,
        minDist: 1,
        friendly: false,
        playable: true,

    },

    //------------------------------------------------------- UNIVERSAL -----------------------------------------------------
    repair: {
        name: "Repair-Kit",
        getDescription: card => `Heal unit for ${ card.type.damage } health`,
        color: "#32a852",
        sprite: repair,
        backing: metal,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            target?.addHealth( card.type.damage )

            //Exhaustive
            //look for the card in the users Discard Pile and remove it
            user.discard.cards.pop()
        },
        render: ( animationFrame, user, pos ) => {
            let g = Graphics.instance
            let game = Game.instance
            let match = game.match
            let tileSize = 32
            let target = match.getUnit(pos)
            if (target) {
                let targetPos = target.pos.scale(tileSize).add(new Vector(tileSize/2, tileSize/2))
                let color = `rgba(0, 255, 0, ${animationFrame})`
                // g.drawRect(targetPos, new Vector(tileSize, tileSize).scale(2), color)
                g.fillCircle(targetPos, Math.abs(Math.sin(animationFrame*Math.PI*6)*tileSize*0.8), color)
                console.log("drawing repair!")
            }
        },
        renderFrames: 40,

        cost: 0,
        damage: 7,
        range: 1,
        minDist: 0,
        friendly: true,
        playable: true,
        exhaustive: true


    },
    sprint: {
        name: "Sprint",
        getDescription: card => `Take ${ card.type.damage } damage, Gain ${ card.type.range } speed, Gain ${ card.type.cost } Energy`,
        color: "#667799",
        sprite: sprint,
        backing: metal,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            if ( target ) {
                user.addHealth( -card.type.damage )
                target.addEnergy( card.type.cost )
                target.addSpeed( card.type.range )
            }
            console.log( user.discard.cards.pop() )
        },

        cost: 1,
        damage: 3,
        range: 1,
        minDist: 0,
        friendly: true,
        playable: true,
        exhaustive: true

    },
    rifle: {
        name: "Rifle",
        getDescription: card => `Deal ${ card.type.damage } damage to target`,
        color: "#969696",
        sprite: rifle,
        backing: metal,
        canApplyToEmptyTiles: false,
        // getTilesInRange: ( card, user ) => lineOfSightTargets( user.pos, { range: card.type.range } ),
        getTilesInRange: ( card, user ) => rookStyleTargets( user.pos, { range: card.type.range } ),
        onApplyToTile: ( card, user, pos, target ) => {
            target?.addHealth( -card.type.damage )
            //this card should target using LOS(Line of Sight)
        },

        render: (animationFrame, user, pos ) => {
            let g = Graphics.instance
            let game = Game.instance
            let world = game.match
            let tileSize = 32
            let target = world.getUnit(pos)
            if (target) {
                let userPos = user.pos.scale(tileSize).add(new Vector(tileSize/2, tileSize/2))
                let targetPos = target.pos.scale(tileSize).add(new Vector(tileSize/2, tileSize/2))
                let bullet = {
                    pos: userPos.lerp(targetPos, animationFrame),
                    radius: 2,
                    color: "rgba(50, 0, 0)"
                }
                for (let i = 0; i < 5; i++) {
                    let spread = 4
                    let noise = new Vector(Math.random()*spread, Math.random()*spread)
                    g.fillCircle(bullet.pos.add(noise), bullet.radius, bullet.color)
                }
            }
        },
        renderFrames: 4,

        cost: 1,
        damage: 4,
        range: 5,
        minDist: 2,

        friendly: false,
        playable: true
    },
    //------------------------------------------------------- FLESH -----------------------------------------------------
    claw: {
        name: "Claw",
        getDescription: card => `Deal ${ card.type.damage } damage`,
        color: "#af0000",
        sprite: claw,
        backing: flesh,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {

            if ( target ) {
                // let bonusDMG = user.maxHealth - user.health
                // card.type.damage = bonusDMG + 1
                target.addHealth( -card.type.damage )
            }
        },

        cost: 0,
        damage: 3,
        range: 1,
        minDist: 1,
        friendly: false,
        playable: true,

    },
    // acid: {
    //     name: "Acid",
    //     getDescription: card => `Melts Armor, target maxHealth -= ${card.type.damage} target speed += 1`,
    //     color: "#32a852",
    //     sprite: acid,
    //     backing: purple,
    //     canApplyToEmptyTiles: false,
    //     getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
    //     onApplyToTile: ( card, user, pos, target ) => {
    //         

    //         if ( target ) {
    //             target.addMaxHealth(-card.type.damage)
    //             target.maxSpeed += 2
    //             target.addHealth(-2)
    //         }
    //     },

    //     cost: 1,
    //     damage: 3,
    //     range: 5,
    //     minDist: 0,
    //     friendly: false,
    //     playable: true,
    // },
    //------------------------------------------------------- TREE --------------------------------------------------------
    perfume: {
        name: "Perfume",
        getDescription: card => `Reduce MaxHP by ${ card.type.damage }, increase Speed by ${ card.type.damage }`,
        color: "#026822",
        sprite: pollen,
        backing: green,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {

            if ( target ) {
                target.speed += card.type.damage
                target.addMaxHealth( -card.type.damage )
            }
        },

        cost: 1,
        damage: 2,
        range: 6,
        minDist: 0,
        friendly: false,
        playable: true,
    },
    root: {
        name: "Root",
        getDescription: card => `Immobilize Target Target Heals ${ card.type.damage } HP`,
        color: "#026822",
        sprite: root,
        backing: green,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => bishopStyleTargets( user.pos, { range: card.type.range } ),
        onApplyToTile: ( card, user, pos, target ) => {

            if ( target ) {
                target.speed = 1
                target.addHealth( card.type.damage )
            }
        },

        cost: 1,
        damage: 8,
        range: 6,
        minDist: 0,
        friendly: false,
        playable: true,
    },
    flower: {
        name: "Flower",
        getDescription: card => `Grant Target ${ card.type.damage } Fruits`,
        color: "#026822",
        sprite: flower,
        backing: green,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            if ( target ) {
                target.draw.add( CardTypes.fruit, 2 )
            }
        },

        cost: 1,
        damage: 2,
        range: 4,
        minDist: 0,
        friendly: false,
        playable: true,
    },
    fruit: {
        name: "Fruit",
        getDescription: card => `Grant User ${ card.type.damage } HP -Exhaustive`,
        color: "#026822",
        sprite: fruit,
        backing: green,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            target?.addHealth(card.type.damage)
        },

        cost: 0,
        damage: 2,
        range: 1,
        minDist: 0,
        friendly: true,
        playable: true,
        exhaustive: true,
    },
    //----------------------------------------------- ELDRITCH --------------------------------------------
    tentacle: {
        name: "Tentacle Pull",
        getDescription: card => `Pull target to you from ${ card.type.range } tiles away.`,
        color: "#990099",
        sprite: tentacle,
        backing: purple,
        canApplyToEmptyTiles: false,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            // console.log(user.hand)
            if ( target ) {
                //Chaining Ternary functions are weird man
                let xShift = ( user.pos.x < target.pos.x ) ?
                    user.pos.x + 1 : ( user.pos.x == target.pos.x ) ?
                        user.pos.x : user.pos.x - 1
                let yShift = ( user.pos.y < target.pos.y ) ?
                    user.pos.y + 1 : ( user.pos.y == target.pos.y ) ?
                        user.pos.y : user.pos.y - 1
                let newPos = new Vector( xShift, yShift )
                let path = [ target.pos, newPos ]
                target.move( path )
            }

        },

        cost: 1,
        damage: 0,
        range: 6,
        minDist: 1,
        friendly: false,
        playable: true,

    },
    bubbletoss: {
        name: "Bubble Toss",
        getDescription: card => `Create shallow water, Deal ${ card.type.damage } damage`,
        color: "#990099",
        sprite: jelly,
        backing: purple,
        canApplyToEmptyTiles: true,
        getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
        onApplyToTile: ( card, user, pos, target ) => {
            let match = Game.instance.match
            match.map.set( pos, Tiles.WaterShallow )
            target?.addHealth( -card.type.damage )

        },

        cost: 1,
        damage: 2,
        range: 5,
        minDist: 2,
        friendly: false,
        playable: true,

    },
    // frost: {
    //     name: "Frost",
    //     getDescription: card => `Deals ${card.type.damage} damage (unit's missing health)`,
    //     color: "#0000aa",
    //     sprite: frost,
    //     backing: purple,
    //     canApplyToEmptyTiles: false,
    //     getTilesInRange: ( card, user ) => targetsWithinRange( user.pos, card.type.minDist, card.type.range ),
    //     onApplyToTile: ( card, user, pos, target ) => {
    //         
    //         // user.health -= 2
    //         //deals damage to target based on previously sustained damage
    //         if ( target ) {
    //             let damage = target.maxHealth - target.health
    //             card.type.damage = damage
    //             target.addHealth(-card.type.damage)
    //         }
    //     },

    //     cost: 1,
    //     damage: 2,
    //     range: 3,
    //     minDist: 0,
    //     friendly: false,
    //     playable: true,
    // }
}

export default CardTypes

const cardTypeList = Object.values( CardTypes )
export function randomCardType() {
    let i = Math.floor( Math.random() * cardTypeList.length )
    return cardTypeList[ i ]
}

type scanOptions = {
    range?: number,
    ignoreObstacles?: boolean,
    ignoreElevation?: boolean,
    result?: Vector[],
    passable?: (pos) => boolean
}

// Target generation
function targetsAlongLine(
    pos: Vector, delta: Vector,
    { range = Infinity, ignoreObstacles = false, ignoreElevation = false, result = [], passable = undefined }: scanOptions
        
) {
    let match = Game.instance.match
    let elevation0 = match.map.getElevation( pos )

    passable = passable ?? ((pos) => match.isWalkable(pos, false))

    for ( let i = 1; i <= range; i++ ) {
        let p2 = pos.add( delta.scale( i ) )
        let inBounds = match.map.contains( p2 )
        let hitsUnit = match.getUnit( p2 ) !== undefined

        //Manually step through and assign tiles
        //steal code from blastCharges getTilesEffected

        let contained = false
        result.forEach( (val, i) => {
            if ( p2.equals(val) ) {
                contained = true
            }
        } )
        if ( !contained ) {
            result.push( p2 )
        }
    }
    return result
}

function rookStyleTargets(
    pos: Vector,
    { range = Infinity, ignoreObstacles = false, ignoreElevation = false, result = [] }: scanOptions
) {
    targetsAlongLine( pos, new Vector( 1, 0 ), { range, ignoreObstacles, result } )
    targetsAlongLine( pos, new Vector( -1, 0 ), { range, ignoreObstacles, result } )
    targetsAlongLine( pos, new Vector( 0, 1 ), { range, ignoreObstacles, result } )
    targetsAlongLine( pos, new Vector( 0, -1 ), { range, ignoreObstacles, result } )
    return result
}

function bishopStyleTargets(
    pos: Vector,
    { range = Infinity, ignoreObstacles = false, ignoreElevation = false, result = [] }: scanOptions
) {
    targetsAlongLine( pos, new Vector( 1, 1 ), { range, ignoreObstacles, result } )
    targetsAlongLine( pos, new Vector( -1, -1 ), { range, ignoreObstacles, result } )
    targetsAlongLine( pos, new Vector( -1, 1 ), { range, ignoreObstacles, result } )
    targetsAlongLine( pos, new Vector( 1, -1 ), { range, ignoreObstacles, result } )
    return result
}

function lineOfSightTargets(
    pos: Vector,
    { range = Infinity, ignoreObstacles = false, ignoreElevation = false, result = [] }: scanOptions
) {     
        let map = Game.instance.match.map
        for (let x = 0; x <= map.width; x++) {
            for (let y = 0; y <= map.height; y++) {
                let tile = new Vector(x, y)
                let direction = tile.subtract( pos )
                direction = direction.scale(1 / direction.length)
                targetsAlongLine(pos, direction, { range: range, ignoreObstacles: false, result } )
            }
        }
    return result
}

export function targetsWithinRange( pos: Vector, minDist: number, maxDist: number, result: Vector[] = [] ) {
    // console.log("target start:", pos)
    for ( let dx = -maxDist; dx <= maxDist; dx++ ) {
        for ( let dy = -maxDist; dy <= maxDist; dy++ ) {
            let r = Math.abs( dx ) + Math.abs( dy )
            if ( r >= minDist && r <= maxDist )
                result.push( pos.addXY( dx, dy ) )
        }
    }
    return result
}
