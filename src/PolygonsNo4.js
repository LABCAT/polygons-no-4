
import { Midi } from '@tonejs/midi';
import Polygon from './classes/Polygon'
import BubblePolygons from './classes/BubblePolygons'

/** 
 * Add your ogg and mid files in the audio director and update these file names
 */
const audio = new URL("@audio/polygons-no-4.ogg", import.meta.url).href;
const midi = new URL("@audio/polygons-no-4.mid", import.meta.url).href;


const PolygonsNo4 = (p) => {
    /** 
     * Core audio properties
     */
    p.song = null;
    p.bpm = 104;
    p.audioLoaded = false;
    p.songHasFinished = false;

    /** 
     * Preload function - Loading audio and setting up MIDI
     * This runs first, before setup()
     */
    p.preload = () => {
        p.song = p.loadSound(audio, p.loadMidi);
        p.song.onended(() => p.songHasFinished = true);
    };

    p.bubbleLayer = null;
    
    p.setup = () => {
        // Use WebGL for better performance
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        document.getElementById("loader").classList.add("loading--complete");
        p.noFill();
        p.colorMode(p.HSB);
        p.rectMode(p.CENTER);

        p.bubbleLayer = p.createGraphics(p.windowWidth, p.windowHeight);
        p.bubbleLayer.colorMode(p.HSB);
        p.bubbleLayer.rectMode(p.CENTER);
        p.bubbleLayer.noFill();
    };

    p.draw = () => {
        if(p.audioLoaded && p.song.isPlaying()){
            // Clear the main canvas
            p.clear();
            p.translate(-p.width/2, -p.height/2);
            
            // Draw normal polygons
            if (p.polygons.length > 0) {
                p.strokeWeight(4);
                p.polygons.forEach(polygon => {
                    polygon.update();
                    polygon.draw();
                });
            }
            
            // Handle bubble polygons on the secondary layer
            if (p.bubblePolygons.length > 0) {
                p.strokeWeight(1);
                // First remove any inactive bubble polygons
                p.bubblePolygons = p.bubblePolygons.filter(bubble => bubble.isActive());
                
                // Then draw all active ones - save the p5 renderer state
                const originalCanvas = p._renderer;
                p._renderer = p.bubbleLayer._renderer;
                
                p.bubblePolygons.forEach(bubble => {
                    bubble.draw();
                });
                
                // Restore the original renderer
                p._renderer = originalCanvas;
            }
            
            // Draw the bubble layer onto the main canvas
            p.image(p.bubbleLayer, 0, 0);
        }
    }

    /** 
     * MIDI loading and processing
     * Handles synchronization between audio and visuals
     */
    p.loadMidi = () => {
        Midi.fromUrl(midi).then((result) => {
            console.log('MIDI loaded:', result);
            const track1 = result.tracks[3].notes; // Combinator - Loading Screen
            p.scheduleCueSet(track1, 'executeTrack1');
            const track2 = result.tracks[4].notes; // Europa - Cinematic Pulse
            p.scheduleCueSet(track2, 'executeTrack2');
            document.getElementById("loader").classList.add("loading--complete");
            document.getElementById('play-icon').classList.add('fade-in');
            p.audioLoaded = true;
        });
    };

    /** 
     * Schedule MIDI cues to trigger animations
     * @param {Array} noteSet - Array of MIDI notes
     * @param {String} callbackName - Name of the callback function to execute
     * @param {Boolean} polyMode - Allow multiple notes at same time if true
     */
    p.scheduleCueSet = (noteSet, callbackName, polyMode = false) => {
        let lastTicks = -1,
            currentCue = 1;
        for (let i = 0; i < noteSet.length; i++) {
            const note = noteSet[i],
                { ticks, time } = note;
            if(ticks !== lastTicks || polyMode){
                note.currentCue = currentCue;
                p.song.addCue(time, p[callbackName], note);
                lastTicks = ticks;
                currentCue++;
            }
        }
    }

    p.polygons = [];

    // Add these variables at the class level
    p.currentCycleShapes = [];
    p.positionPattern = null;
    p.positionOrder = [0, 1, 2, 3, 4];

    p.executeTrack1 = (note) => {
        const { currentCue, durationTicks } = note;
        
        if (currentCue % 5 === 1) {
            p.polygons = [];
            
            // Shuffle shapes for this cycle
            const shapes = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];
            p.currentCycleShapes = [...shapes].sort(() => p.random(-1, 1));
            
            // Choose a position pattern for this cycle
            p.selectPositionPattern();
        }

        const PPQ = 15360;
        const durationMs = (durationTicks / PPQ) * (60000 / p.bpm);

        const index = (currentCue - 1) % 5;
        const newPolygon = new Polygon(p, p.width / 2, p.height / 2, durationMs, [0, 4].includes(currentCue % 5));
        
        // Assign shape from the cycle - we still want to use sequential shapes
        // even though positions are randomized
        newPolygon.shape = p.currentCycleShapes[index];
        
        p.polygons.push(newPolygon);
    }

    p.bubblePolygons = [];

    p.executeTrack2 = (note) => {
        const { currentCue, midi } = note;

        if (currentCue % 5 === 1) {
            p.bubbleLayer.clear();
            p.bubblePolygons = [];
        }
            
        // Get sequential index in this set of 5
        const index = (currentCue - 1) % 5;
        const position = p.getPosition(index);
        
        // Use shapes from your cycle for consistency
        const shape = p.currentCycleShapes[index];
        
        // Generate hue based on note properties for visual variety
        // This creates colors that relate to the music
        const hue = ((midi % 12) * 30 + currentCue * 17) % 360;
        
        // Create a new BubblePolygons instance
        const bubblePolygon = new BubblePolygons(p, position.x, position.y, hue, shape);
        
        // Add to array for rendering
        p.bubblePolygons.push(bubblePolygon);
    };

    p.selectPositionPattern = () => {
        const patterns = ['grid', 'diagonal', 'wave', 'corners'];
        p.positionPattern = patterns[Math.floor(p.random() * patterns.length)];
        
        // Generate random order for positions
        p.positionOrder = [0, 1, 2, 3, 4].sort(() => p.random(-1, 1));
    };

    p.getPosition = (index) => {
        // Use the randomized position order
        const posIndex = p.positionOrder[index];
        
        const w = p.width;
        const h = p.height;
        let x, y;
        
        switch (p.positionPattern) {
            case 'circle':
                // Positions in a circle around center
                const angle = (posIndex / 5) * p.TWO_PI;
                const radius = Math.min(w, h) * 0.3;
                x = w/2 + radius * Math.cos(angle);
                y = h/2 + radius * Math.sin(angle);
                break;
                
            case 'grid':
                // 3x2 grid with centered second row
                if (posIndex < 3) {
                    // First row - 3 positions
                    x = w * (0.25 + posIndex * 0.25);
                    y = h * 0.33;
                } else {
                    // Second row - 2 positions centered
                    x = w * (0.33 + (posIndex - 3) * 0.33);
                    y = h * 0.67;
                }
                break;
                
            case 'diagonal':
                // Diagonal from top-left to bottom-right
                const t = posIndex / 4;
                x = w * 0.1 + (w * 0.8 * t);
                y = h * 0.1 + (h * 0.8 * t);
                break;
                
            case 'wave':
                // Horizontal wave pattern
                x = (posIndex + 0.5) * (w / 5);
                const amplitude = h * 0.25;
                y = h/2 + amplitude * Math.sin((posIndex / 4) * p.TWO_PI);
                break;
                
            case 'corners':
                // Each in a corner or center
                switch (posIndex) {
                    case 0: x = w * 0.2; y = h * 0.2; break; // Top left
                    case 1: x = w * 0.8; y = h * 0.2; break; // Top right
                    case 2: x = w * 0.5; y = h * 0.5; break; // Center
                    case 3: x = w * 0.2; y = h * 0.8; break; // Bottom left
                    case 4: x = w * 0.8; y = h * 0.8; break; // Bottom right
                }
                break;
                
            default:
                // Fallback to random positions
                x = p.random(w * 0.1, w * 0.9);
                y = p.random(h * 0.1, h * 0.9);
        }
        
        return { x, y };
    };

    /** 
     * Handle mouse/touch interaction
     * Controls play/pause and reset functionality
     */
    p.mousePressed = () => {
        if(p.audioLoaded){
            if (p.song.isPlaying()) {
                p.song.pause();
            } else {
                if (parseInt(p.song.currentTime()) >= parseInt(p.song.buffer.duration)) {
                    /** 
                     * Reset animation properties here
                     */
                }
                document.getElementById("play-icon").classList.remove("fade-in");
                p.song.play();
            }
        }
    }
};

export default PolygonsNo4;