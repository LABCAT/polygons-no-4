import ColorGenerator from '@lib/p5.colorGenerator'

export default class Polygon {
  constructor(p, x, y, maxSize, durationMs = 1000) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 0;
    this.maxSize = maxSize;
    this.durationMs = Math.max(1, durationMs); // Ensure duration is at least 1ms
    this.nestedCount = p.random([2, 3, 4]);
    
    // Initialize animation timing variables
    this.startTime = p.millis();
    this.growthPerFrame = 0;
    
    this.colourGenerator = new ColorGenerator(p, 'bright');
    this.colours = this.colourGenerator.getOpacityVariations(4);
    
    // Select a random shape
    const shapes = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];
    this.shape = shapes[Math.floor(p.random() * shapes.length)];
  }
  
  update() {
    const currentTime = this.p.millis();
    const elapsedTime = currentTime - this.startTime;
    
    // Calculate size based on elapsed time and duration
    if (elapsedTime >= this.durationMs) {
      // Animation complete
      this.size = this.maxSize;
    } else {
      // Animation in progress
      const progress = elapsedTime / this.durationMs;
      this.size = progress * this.maxSize;
    }
  }
  
  draw() {
    // Draw original shape
    this.drawShape(this.size);
    
    // Draw nested shapes
    for (let index = 1; index <= this.nestedCount; index++) {
      this.drawShape(this.size / index);
    }
  }
  
  drawShape(size) {
    if (size <= 0) return;
    // Draw 7 shapes with varying opacity (from -3 to +3)
    for (let i = -3; i <= 3; i++) {
      const shapeSize = size + (i * 16);
      if (shapeSize <= 0) continue;
      
      // Calculate color index based on distance from center (0)
      // This creates a gradient effect with stronger color in the middle
      const colorIndex = 3 - Math.abs(i);
      
      this.p.stroke(this.colours[colorIndex]);
      this.p[this.shape](this.x, this.y, shapeSize, shapeSize);
    }
  }
}