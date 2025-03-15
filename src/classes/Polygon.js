import ColorGenerator from '@lib/p5.colorGenerator'

export default class Polygon {
  constructor(p, x, y, durationMs = 0, isLast = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 0;
    this.isLast = isLast;
    
    // Calculate nested count based on duration and BPM
    if (durationMs > 0 && this.p.bpm) {
      const barDuration = (60000 / this.p.bpm) * 4; // 4 quarter notes per bar
      const repeatsPerBar = 2;
      const repeatInterval = barDuration / repeatsPerBar;
      
      // Calculate total repeats based on duration
      this.nestedCount = Math.max(1, Math.floor(durationMs / repeatInterval));
    } else {
      // Default to 3 if no duration or BPM specified
      this.nestedCount = 3;
    }
    this.colourGenerator = new ColorGenerator(p, 'bright');
    this.colours = this.colourGenerator.getOpacityVariations(4);
   
    // Select a random shape
    const shapes = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];
    this.shape = shapes[Math.floor(Math.random() * shapes.length)];
  }
 
  update() {
    const sizeAdjuster = this.isLast ? 96 : 16;
    this.size += sizeAdjuster;
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