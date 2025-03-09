import { Midi } from '@tonejs/midi';
import Polygon from './classes/Polygon'

/** 
 * Add your ogg and mid files in the audio director and update these file names
 */
const audio = new URL("@audio/polygons-no-4.ogg", import.meta.url).href;
const midi = new URL("@audio/polygons-no-4.mid", import.meta.url).href;


const PolygonsNo5 = (p) => {
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

    /** 
     * Setup function - Initialize your canvas and any starting properties
     * This runs once after preload
     */
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        document.getElementById("loader").classList.add("loading--complete");
        p.noFill();
        p.colorMode(p.HSB);
        p.rectMode(p.CENTER);
        p.strokeWeight(4);
    };

    /** 
     * Main draw loop - This is where your animations happen
     * This runs continuously after setup
     */
    p.draw = () => {
        p.background(0);
        if(p.audioLoaded && p.song.isPlaying() || p.songHasFinished){
            
            p.translate(-p.width/2, -p.height/2);

            if (p.polygons.length > 0) {
                p.polygons.forEach(polygon => {
                    polygon.update();
                    polygon.draw();
                });
            } 
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

    p.executeTrack1 = (note) => {
        const { currentCue, durationTicks } = note;
        
        // Reset polygons when currentCue % 5 === 1
        if (currentCue % 5 === 1) {
            p.polygons = []; // Clear all polygons
        }
        
        // Convert durationTicks to milliseconds using BPM
        // For two bars (122880 ticks) at 104 BPM:
        const PPQ = 15360; // Ticks per quarter note based on your data
        const durationMs = (durationTicks / PPQ) * (60000 / p.bpm);
        
        // Create a new polygon at a random position
        const x = p.random(p.width / 8, p.width - p.width / 8);
        const y = p.random(p.height / 8, p.height - p.height / 8);
        
        // Add new polygon to the collection with the duration
        p.polygons.push(new Polygon(p, x, y, durationMs));
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

export default PolygonsNo5;