
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

    p.mainPolygonLayer = null;
    
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

        p.mainPolygonLayer = p.createGraphics(p.windowWidth, p.windowHeight);
        p.mainPolygonLayer.colorMode(p.HSB);
        p.mainPolygonLayer.rectMode(p.CENTER);
        p.mainPolygonLayer.noFill();
    };

    p.draw = () => {
        if(p.audioLoaded && p.song.isPlaying()){
            // Clear the main canvas
            p.clear();
            p.translate(-p.width/2, -p.height/2);
            
            // Handle bubble polygons on the secondary layer
            if (p.bubblePolygons.length > 0) {
                p.strokeWeight(1);
                // First remove any inactive bubble polygons
                p.bubblePolygons = p.bubblePolygons.filter(bubble => bubble.isActive());
                
                // Then draw all active ones - save the p5 renderer state
                const originalCanvas = p._renderer;
                p._renderer = p.bubbleLayer._renderer;
                
                p.bubblePolygons.forEach(bubble => {
                    bubble.setOpacity(p.map(p.bubbleOpacity, 0.5, 1, 0, 0.9));
                    bubble.draw();
                });
                
                // Restore the original renderer
                p._renderer = originalCanvas;
            }

            // Draw normal polygons
            if (p.polygons.length > 0) {
                
                const originalCanvas = p._renderer;
                p._renderer = p.mainPolygonLayer._renderer;
                p.mainPolygonLayer.clear();

                p.strokeWeight(4);
                p.polygons.forEach(polygon => {
                    polygon.update();
                    polygon.draw();
                });

                p._renderer = originalCanvas;
            }
            
            p.image(p.bubbleLayer, 0, 0);
            p.image(p.mainPolygonLayer, 0, 0);
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
            const controlChanges = Object.assign({},result.tracks[5].controlChanges); // Cinematic Pulse Filter
            const track3 = controlChanges[Object.keys(controlChanges)[0]];
            p.scheduleCueSet(track3, 'executeTrack3');
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

    p.currentCycleShapes = [];
    p.positionPattern = null;
    p.positionOrder = [0, 1, 2, 3, 4];
    p.hueOffset = 0;

    p.executeTrack1 = (note) => {
        const { currentCue, durationTicks } = note;
        
        if (currentCue % 5 === 1) {
            p.polygons = [];
            const shapes = ['equilateral', 'rect', 'pentagon', 'hexagon', 'octagon'];
            p.currentCycleShapes = [...shapes].sort(() => p.random(-1, 1));
            p.selectPositionPattern();

            if(currentCue > 1) {
                p.hueOffset = (p.hueOffset + 40) % 360;
                const newHue = p.hueOffset;
                
                // Update CSS custom properties
                document.documentElement.style.setProperty('--accent-color', `hsla(${newHue}, 100%, 50%, 0.6)`);
                document.documentElement.style.setProperty('--accent-color-fade1', `hsla(${newHue}, 100%, 50%, 0.4)`);
                document.documentElement.style.setProperty('--accent-color-fade2', `hsla(${newHue}, 100%, 50%, 0.1)`);
            }
        }
        
        const PPQ = 15360;
        const durationMs = (durationTicks / PPQ) * (60000 / p.bpm);
        const index = (currentCue - 1) % 5;
        
        // Calculate size with pattern-based limitations
        const barDuration = (60000 / p.bpm) * 4;
        const barCount = durationMs / barDuration;
        
        // Base size calculation
        // Base size calculation - screen-responsive
        let baseSize = Math.min(p.width, p.height) * 0.3;
        let minSize = baseSize + Math.min(baseSize, barCount * 30);
        let maxSize = baseSize * 1.5 + Math.min(baseSize, barCount * 30);

        // Reduce size based on pattern to prevent overlaps
        if (p.positionPattern === 'grid' || p.positionPattern === 'corners') {
            minSize *= 0.6;
            maxSize *= 0.6;
        } else if (p.positionPattern === 'diagonal' || p.positionPattern === 'wave') {
            minSize *= 0.7;
            maxSize *= 0.7;
        }

        const polygonMaxSize = p.random(minSize, maxSize);
        
        // Use original position
        const position = p.getComplementaryPosition(index);
        
        const newPolygon = new Polygon(
            p,
            position.x,
            position.y,
            polygonMaxSize,
            durationMs
        );
        
        newPolygon.shape = p.currentCycleShapes[index];
        p.polygons.push(newPolygon);
    };

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

    p.executeTrack3 = (note) => {
        p.bubbleOpacity = note.value;
    }

    p.selectPositionPattern = () => {
        const patterns = ['grid', 'diagonal', 'wave', 'invertedWave', 'corners'];
        p.positionPattern = patterns[Math.floor(p.random() * patterns.length)];
        
        // Generate random order for positions
        p.positionOrder = [0, 1, 2, 3, 4].sort(() => p.random(-1, 1));
    };

    p.getPosition = (index) => {
        const posIndex = p.positionOrder[index];
        const w = p.width;
        const h = p.height;
        let x, y;
        
        switch (p.positionPattern) {
            case 'grid':
                if (posIndex < 3) {
                    x = w * (0.15 + posIndex * 0.35); // More spread out (0.15, 0.5, 0.85)
                    y = h * 0.28; // Moved higher
                } else {
                    x = w * (0.25 + (posIndex - 3) * 0.5); // More spread out (0.25, 0.75)
                    y = h * 0.72; // Moved lower
                }
                break;
                
            case 'diagonal':
                const tDiag = posIndex / 4;
                x = w * 0.1 + (w * 0.8 * tDiag);
                y = h * 0.1 + (h * 0.8 * tDiag);
                break;
                
            case 'wave':
                x = (posIndex + 0.5) * (w / 5);
                const amplitude = h * 0.25;
                y = h/2 + amplitude * Math.sin((posIndex / 4) * p.TWO_PI);
                break;

            case 'invertedWave':
                x = (posIndex + 0.5) * (w / 5);
                const amplitudeInv = h * 0.25;
                y = h/2 + amplitudeInv * Math.cos((posIndex / 4) * p.TWO_PI);
                break;
                
            case 'corners':
                switch (posIndex) {
                    case 0: x = w * 0.15; y = h * 0.15; break; // More toward corner
                    case 1: x = w * 0.85; y = h * 0.15; break; // More toward corner
                    case 2: x = w * 0.5; y = h * 0.5; break; // Center stays the same
                    case 3: x = w * 0.15; y = h * 0.85; break; // More toward corner
                    case 4: x = w * 0.85; y = h * 0.85; break; // More toward corner
                }
                break;
                
            default:
                x = p.random(w * 0.1, w * 0.9);
                y = p.random(h * 0.1, h * 0.9);
        }
        
        return { x, y };
    };

    p.getComplementaryPosition = (index) => {
        const posIndex = p.positionOrder[index];
        const w = p.width;
        const h = p.height;
        let x, y;
        
        switch (p.positionPattern) {
            case 'grid':
                if (posIndex < 2) {
                    x = w * (0.25 + posIndex * 0.5); // More spread out (0.25, 0.75)
                    y = h * 0.28; // Matched height
                } else {
                    x = w * (0.15 + (posIndex - 2) * 0.35); // More spread out (0.15, 0.5, 0.85)
                    y = h * 0.72; // Matched height
                }
                break;
                
            case 'diagonal':
                const tDiag = posIndex / 4;
                x = w * 0.9 - (w * 0.8 * tDiag);
                y = h * 0.1 + (h * 0.8 * tDiag);
                break;
                
            case 'wave':
                x = (posIndex + 0.5) * (w / 5);
                const amplitudeWave = h * 0.25;
                y = h/2 - amplitudeWave * Math.sin((posIndex / 4) * p.TWO_PI);
                break;
                
            case 'invertedWave':
                x = (posIndex + 0.5) * (w / 5);
                const amplitudeInvWave = h * 0.25;
                y = h/2 - amplitudeInvWave * Math.cos((posIndex / 4) * p.TWO_PI);
                break;
                
            case 'corners':
                switch (posIndex) {
                    case 0: x = w * 0.5; y = h * 0.15; break;
                    case 1: x = w * 0.15; y = h * 0.5; break;
                    case 2: x = w * 0.5; y = h * 0.5; break;
                    case 3: x = w * 0.85; y = h * 0.5; break;
                    case 4: x = w * 0.5; y = h * 0.85; break;
                }
                break;
                
            default:
                x = p.random(w * 0.1, w * 0.9);
                y = p.random(h * 0.1, h * 0.9);
        }
        
        return { x, y };
    }

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