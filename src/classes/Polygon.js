import ColorGenerator from '@lib/p5.colorGenerator'
export default class Polygon {
  constructor(p, x, y, durationMs = 0) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = 0;
    this.colourGenerator = new ColorGenerator(p, 'bright');
    this.colours = this.colourGenerator.getOpacityVariations(4);
   
    // Select a random shape
    const shapes = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];
    this.shape = shapes[Math.floor(Math.random() * shapes.length)];
    this.numRings = 8;
   
    // Pre-calculate the color indices to avoid repetitive calculations
    this.colorIndices = [];
    for (let i = 0; i < this.numRings; i++) {
      this.colorIndices[i] = Math.min(3, Math.floor((i / this.numRings) * 4));
    }
    
    // Calculate the exact number of repeats needed
    this.activeRepeats = [];
   
    // Only schedule repeats if there's actually duration
    if (durationMs > 0) {
      const barDuration = (60000 / this.p.bpm) * 4; // 4 quarter notes per bar
      const repeatsPerBar = 2;
      const repeatInterval = barDuration / repeatsPerBar;
     
      // Calculate total repeats - subtract 1 to account for original polygon
      const totalRepeats = Math.max(0, Math.floor(durationMs / repeatInterval) - 1);
     
      // Generate schedule for repeats
      this.pendingRepeats = Array.from({length: totalRepeats}, (_, i) =>
        Date.now() + ((i + 1) * repeatInterval)
      );
    } else {
      this.pendingRepeats = [];
    }
  }
 
  update() {
    this.size += 16;
   
    // Check for new repeats to activate
    const now = Date.now();
    const activatedRepeats = [];
    const stillPending = [];
   
    // Check each pending repeat
    this.pendingRepeats.forEach(time => {
      if (now >= time) {
        activatedRepeats.push(0); // New repeat with size 0
      } else {
        stillPending.push(time);
      }
    });
   
    // Update state
    this.pendingRepeats = stillPending;
   
    // Update existing active repeats
    this.activeRepeats = this.activeRepeats.map(size => size + 16);
   
    // Add newly activated repeats
    this.activeRepeats = [...this.activeRepeats, ...activatedRepeats];
  }
 
  draw() {
    // Draw original and repeats
    this.drawShape(this.size);
    this.activeRepeats.forEach(size => this.drawShape(size));
  }
 
  drawShape(size) {
    if (size <= 0) return;
   
    // Draw 7 rings with varying opacity (from -3 to +3)
    for (let i = -3; i <= 3; i++) {
    const ringSize = size + (i * 12);
    if (ringSize <= 0) continue;
    
    // Calculate color index based on distance from center (0)
    // This creates a gradient effect with stronger color in the middle
    const colorIndex = 3 - Math.abs(i);
    
    this.p.stroke(this.colours[colorIndex]);
    this.p[this.shape](this.x, this.y, ringSize, ringSize);
    }
  }
}