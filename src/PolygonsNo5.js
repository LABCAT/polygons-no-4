import { Midi } from '@tonejs/midi';

/** 
 * Add your ogg and mid files in the audio director and update these file names
 */
const audio = new URL("@audio/your-audio-file.ogg", import.meta.url).href;
const midi = new URL("@audio/your-midi-file.mid", import.meta.url).href;


const PolygonsNo5 = (p) => {
    let shaderProgram;
    let currentColor;
    let lastColorChange = 0;

    const vertexShader = `
        attribute vec3 aPosition;
        attribute vec2 aTexCoord;
        varying vec2 vTexCoord;

        void main() {
        vTexCoord = aTexCoord;
        vec4 positionVec4 = vec4(aPosition, 1.0);
        positionVec4.xy = positionVec4.xy * 2.0 - 1.0;
        gl_Position = positionVec4;
    }`;
    
    const fragmentShader = `
        precision mediump float;
        varying vec2 vTexCoord;
        uniform vec2 iResolution;
        uniform vec3 heartColor;

        #define POINT_COUNT 8
        vec2 points[POINT_COUNT];
        const float len = 0.25;
        const float scale = 0.012;
        float intensity = 1.3;
        float radius = 0.015;

        float sdBezier(vec2 pos, vec2 A, vec2 B, vec2 C) {    
            vec2 a = B - A;
            vec2 b = A - 2.0*B + C;
            vec2 c = a * 2.0;
            vec2 d = A - pos;
            float kk = 1.0 / dot(b,b);
            float kx = kk * dot(a,b);
            float ky = kk * (2.0*dot(a,a)+dot(d,b)) / 3.0;
            float kz = kk * dot(d,a);      
            float res = 0.0;
            float p = ky - kx*kx;
            float p3 = p*p*p;
            float q = kx*(2.0*kx*kx - 3.0*ky) + kz;
            float h = q*q + 4.0*p3;
            if(h >= 0.0){ 
                h = sqrt(h);
                vec2 x = (vec2(h, -h) - q) / 2.0;
                vec2 uv = sign(x)*pow(abs(x), vec2(1.0/3.0));
                float t = uv.x + uv.y - kx;
                t = clamp(t, 0.0, 1.0);
                vec2 qos = d + (c + b*t)*t;
                res = length(qos);
            } else {
                float z = sqrt(-p);
                float v = acos(q/(p*z*2.0)) / 3.0;
                float m = cos(v);
                float n = sin(v)*1.732050808;
                vec3 t = vec3(m + m, -n - m, n - m) * z - kx;
                t = clamp(t, 0.0, 1.0);
                vec2 qos = d + (c + b*t.x)*t.x;
                float dis = dot(qos,qos);
                res = dis;
                qos = d + (c + b*t.y)*t.y;
                dis = dot(qos,qos);
                res = min(res,dis);
                qos = d + (c + b*t.z)*t.z;
                dis = dot(qos,qos);
                res = min(res,dis);
                res = sqrt(res);
            }
            return res;
        }

        vec2 getHeartPosition(float t) {
            return vec2(16.0 * sin(t) * sin(t) * sin(t),
                        -(13.0 * cos(t) - 5.0 * cos(2.0*t)
                        - 2.0 * cos(3.0*t) - cos(4.0*t)));
        }

        float getGlow(float dist, float radius, float intensity) {
            return pow(radius/dist, intensity);
        }

        float getSegment(float t, vec2 pos, float offset) {
            for(int i = 0; i < POINT_COUNT; i++) {
                points[i] = getHeartPosition(offset + float(i)*len);
            }
            
            vec2 c = (points[0] + points[1]) / 2.0;
            vec2 c_prev;
            float dist = 10000.0;
            
            for(int i = 0; i < POINT_COUNT-1; i++) {
                c_prev = c;
                c = (points[i] + points[i+1]) / 2.0;
                dist = min(dist, sdBezier(pos, scale * c_prev, scale * points[i], scale * c));
            }
            return max(0.0, dist);
        }

        void main() {
            vec2 uv = vTexCoord;
            float widthHeightRatio = iResolution.x/iResolution.y;
            vec2 centre = vec2(0.5, 0.5);
            vec2 pos = centre - uv;
            pos.y /= widthHeightRatio;
            pos.y += 0.03;
            
            float dist = getSegment(0.0, pos, 0.0);
            float glow = getGlow(dist, radius, intensity);
            
            vec3 col = vec3(0.0);
            col += 10.0*vec3(smoothstep(0.006, 0.003, dist));
            col += glow * heartColor;
            
            col = 1.0 - exp(-col);
            col = pow(col, vec3(0.4545));
            
            gl_FragColor = vec4(col, 1.0);
        }`;

    /** 
     * Core audio properties
     */
    p.song = null;
    p.audioLoaded = false;
    p.songHasFinished = false;

    /** 
     * Preload function - Loading audio and setting up MIDI
     * This runs first, before setup()
     */
    p.preload = () => {
        // p.song = p.loadSound(audio, p.loadMidi);
        // p.song.onended(() => p.songHasFinished = true);

    };

    /** 
     * Setup function - Initialize your canvas and any starting properties
     * This runs once after preload
     */
    p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight, p.WEBGL);
        shaderProgram = p.createShader(vertexShader, fragmentShader);
        p.shader(shaderProgram);
        currentColor = p.createVector(1.0, 0.05, 0.3);

        document.getElementById("loader").classList.add("loading--complete");
    };

    /** 
     * Main draw loop - This is where your animations happen
     * This runs continuously after setup
     */
    p.draw = () => {
        if (p.millis() - lastColorChange > 10000) {
            currentColor = p.createVector(p.random(), p.random(), p.random());
            lastColorChange = p.millis();
        }

        shaderProgram.setUniform('iResolution', [p.width, p.height]);
        shaderProgram.setUniform('heartColor', [currentColor.x, currentColor.y, currentColor.z]);
        p.rect(0, 0, p.width, p.height);

        if(p.audioLoaded && p.song.isPlaying() || p.songHasFinished){
            
        }
    }

    /** 
     * MIDI loading and processing
     * Handles synchronization between audio and visuals
     */
    p.loadMidi = () => {
        Midi.fromUrl(midi).then((result) => {
            /** 
             * Log when MIDI is loaded
             */
            console.log('MIDI loaded:', result);
            /** 
             * Example: Schedule different tracks for different visual elements
             */
            const track1 = result.tracks[0].notes;
            /** 
             * Schedule your cue sets
             * You can add multiple tracks by:
             * 1. Getting notes from different MIDI tracks (e.g., tracks[1], tracks[2])
             * 2. Creating corresponding execute functions (e.g., executeTrack2, executeTrack3)
             * 3. Adding new scheduleCueSet calls for each track
             * Example:
             * const track2 = result.tracks[1].notes;
             * const track3 = result.tracks[2].notes;
             * p.scheduleCueSet(track2, 'executeTrack2');
             * p.scheduleCueSet(track3, 'executeTrack3');
             */
            p.scheduleCueSet(track1, 'executeTrack1');
            /** 
             * Update UI elements when loaded
             */
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

    /** 
     * Example track execution functions
     * Add your animation triggers here
     */
    p.executeTrack1 = (note) => {
        /** 
         * Add animation code triggered by track 1
         * Example: trigger based on note properties
         */
        const { midi, velocity, currentCue } = note;
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

export default PolygonsNo5;