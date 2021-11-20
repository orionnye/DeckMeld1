import { Vector } from "../math/Vector"
import Tile from "./Tile"
const {SimplexNoise} = require('simplex-noise');
import Unit from "../gameobjects/Unit"

export default class Grid {
    private simplex = new SimplexNoise();
    private content: Tile[]
    width: number
    height: number
    deepWater: number = 3
    shallowWater: number = 2
    wall: number = 1
    empty: number = 0
    constructor( width, height ) {
        this.width = width
        this.height = height
        this.content = []
        for ( let i = 0; i < width * height; i++ )
            this.content.push( new Tile( this.empty ) )
    }
    randomize( blockChance: number ) {
        for ( let y = 0; y < this.height; y++ ) {
            for ( let x = 0; x < this.width; x++ ) {
                let isBlock = Math.random() < blockChance
                if ( isBlock )
                    this.setFromXY( x, y, this.wall )
            }
        }
    }
    randomize2( blockChance: number = 0.0){
        
        let zoom = 1;
        let h = this.height;
        let w = this.width;

        //radial noise
        let radius = 9 + Math.random();
        let amplitude = 2.5 + (2*Math.random());
        let rFreq = 2/64 + ((6/64) *Math.random());
        let radius2 = radius + (1.5*Math.random());
        let amplitude2 = .5 + (1.5*Math.random())
        let rFreq2 = rFreq + ((8/64) *Math.random());
        let symetric = false

        //topical noise
        let frequency = 1/8;
        let mountaincutoff = .5;
        let watercutoff = -.7;

        for (let x = 0; x < w; x++){
            for (let y = 0; y < h; y++){

                let hyp = Math.hypot((y-(h/2)),(x-(w/2)))
                let radialProjection = [radius,0];
                let radialProjection2 = [radius2,0];

                if (hyp != 0){
                    let y1 = (y-(h/2))
                    let x1 = (x-(w/2))
                    y1 = y1 * (radius / hyp)
                    x1 = x1 * (radius / hyp)
                    y1 = y1 + (h/2)
                    x1 = x1 + (w/2)
                    radialProjection = [x1,y1]
                    let y2 = (y-(h/2))
                    let x2 = (x-(w/2))
                    y2 = y2 * (radius2 / hyp)
                    x2 = x2 * (radius2 / hyp)
                    y2 = y2 + (h/2)
                    x2 = x2 + (w/2)
                    radialProjection2 = [x2,y2]
                }

                let radialTest = radius + (amplitude * this.simplex.noise2D(radialProjection[0]*rFreq, radialProjection[1]*rFreq));
                let radialTest2 = radius2 + (amplitude2 * this.simplex.noise2D(radialProjection2[0]*rFreq2, radialProjection2[1]*rFreq2));
    
                
                if (Math.hypot((x-(w/2)),(y-(h/2))) > radialTest2 && Math.hypot((x-(w/2)),(y-(h/2))) > radialTest) {
                    console.log(`(${x},${y})=deep`)
                    this.setFromXY( x, y, this.deepWater )
                }
                else if (Math.hypot((x-(w/2)),(y-(h/2))) > radialTest) {
                    this.setFromXY( x, y, this.shallowWater )
                }
                else if (this.simplex.noise2D(x*frequency, y*frequency) > mountaincutoff) {
                    this.setFromXY( x, y, this.wall )
                }
                else if(this.simplex.noise2D(x*frequency, y*frequency) < watercutoff){
                    this.setFromXY( x, y, this.shallowWater )
                }
                else{
                    this.setFromXY( x, y, this.empty )
                }
            }
        }
    }
    placeUnits(units: Unit[]){
        for(let iter = 0; iter<units.length;iter++){
            if (iter < (units.length/2)){//first half of units top left
                this.placeUnit(units,units[iter],true)
            }
            else{//second half of units bottom right
                this.placeUnit(units,units[iter],false)
            }
        }
    }
    placeUnit(units: Unit[], placing: Unit, player1: boolean){
        let max = 0
        if (player1){
            max = this.height + this.width
        }
        for ( let y = 0; y < this.height; y++ ) {
            for ( let x = 0; x < this.width; x++ ) {
                let occupied = false;
                units.forEach(unit => {
                    if (unit.pos.x == x && unit.pos.y == y){
                        occupied = true;
                    }
                });
                if ((player1 ? (x+y) < max : (x+y) > max) && !occupied && this.getFromXY(x,y).content == this.empty){
                    max = x + y
                    placing.pos.x = x
                    placing.pos.y = y
                } 
            }
        }    
    }
    set( pos: Vector, value ) {
        this.setFromXY( pos.x, pos.y, value )
    }
    setFromXY( x: number, y: number, value ) {
        if ( y >= this.height || x >= this.width ) {
            console.error( "tried setting value on grid that does not exist" )
            return
        }
        this.content[ y * this.width + x ].content = value
    }
    get( pos: Vector ) {
        return this.getFromXY( pos.x, pos.y )
    }
    getFromXY( x: number, y: number ) {
        return this.content[ y * this.width + x ]
    }
    fillRect( pos: Vector, size: Vector, value ) {
        let startX = Math.max( 0, pos.x )
        let startY = Math.max( 0, pos.y )
        let endX = Math.min( pos.x + size.x, this.width )
        let endY = Math.min( pos.y + size.y, this.height )
        for ( let y = startY; y < endY; y++ ) {
            for ( let x = startX; x < endX; x++ ) {
                this.setFromXY( x, y, value )
            }
        }
    }
    contains( pos: Vector ) {
        return pos.y >= 0 && pos.x >= 0 && pos.x < this.width && pos.y < this.height
    }
    isEmpty( pos: Vector ) {
        return this.get( pos ).content == this.empty
    }
}