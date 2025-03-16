export default class BubblePolygons {
    constructor(p5, startX, startY, hueOrColour, shape = 'pentagon') {
        this.p = p5;
        this.x = startX;
        this.y = startY;
        this.shape = shape;
        this.hue = hueOrColour;
        this.colour = this.p.color(this.hue, 100, 100);
        this.count = this.p.random(2, 8);
        this.polygons = [];
        this.opacity = 1.0;
       
        for (let i = 0; i < this.count; i++) {
            this.polygons.push(
                {
                    x: this.x,
                    y: this.y,
                    size: parseInt(this.p.random(16, 64)),
                    colour: this.p.color(
                        this.hue,
                        this.p.random(50, 100),
                        this.p.random(50, 100),
                    )
                }
            );
        }
    }

    setOpacity(value) {
        this.opacity = value;
    }
   
    draw() {
        const distanceAdjuster = 20;
        for (let i = 0; i < this.polygons.length; i++) {
            const polygon = this.polygons[i],
                { x, y, size, colour } = polygon;
        
            if (size > 0) {
                // Draw the largest polygon with opacity
                this.p.fill(colour._getHue(), colour._getSaturation(), colour._getBrightness(), 0.2 * this.opacity);
                
                // FIRST STROKE CALL - just use the original color with opacity
                this.p.stroke(colour._getHue(), colour._getSaturation(), colour._getBrightness(), this.opacity);
                this.p[this.shape](x, y, size);
            
                this.p.noFill();
            
                // SECOND STROKE CALL - white with opacity in HSB (0,0,100)
                this.p.stroke(0, 0, 100, this.opacity);
                this.p[this.shape](x, y, size / 2);
            
                // THIRD STROKE CALL - back to original color with opacity
                this.p.stroke(colour._getHue(), colour._getSaturation(), colour._getBrightness(), this.opacity);
                this.p[this.shape](x, y, size / 4);
            
                this.polygons[i].x = x - this.p.random(-distanceAdjuster, distanceAdjuster);    
                this.polygons[i].y = y - this.p.random(-distanceAdjuster, distanceAdjuster);    
                this.polygons[i].size = size - this.p.random(0.1, 0.4);    
            }
        }
    }
    
    isActive() {
        // Check if any polygons are still visible
        return this.polygons.some(polygon => polygon.size > 0);
    }
}