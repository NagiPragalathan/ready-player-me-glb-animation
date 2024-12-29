================================================
File: /index.html
================================================
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>


================================================
File: /eslint.config.js
================================================
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]


================================================
File: /test/ReadyPlayerMeIntegaration/.gitignore
================================================

.cache/
coverage/
dist/*
!dist/index.html
node_modules/
*.log

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

index.js

================================================
File: /test/ReadyPlayerMeIntegaration/server.js
================================================
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

let clients = new Map();

wss.on('connection', (ws) => {
    // Assign a unique ID to each client
    const clientId = Date.now();
    clients.set(clientId, { ws, state: {} });

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        clients.get(clientId).state = data;

        // Broadcast the state to all other clients
        clients.forEach((client, id) => {
            if (id !== clientId && client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ clientId, ...data }));
            }
        });
    });

    ws.on('close', () => {
        clients.delete(clientId);
        // Notify all clients that this client has disconnected
        clients.forEach((client) => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify({ clientId, disconnected: true }));
            }
        });
    });
});

console.log('WebSocket server is running on ws://localhost:8080');


================================================
File: /test/ReadyPlayerMeIntegaration/package.json
================================================
{
  "name": "threejs-example",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "npm run build && npm run serve",
    "build": "webpack",
    "serve": "webpack serve"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "npm-run-all": "^4.1.5",
    "ts-loader": "^8.1.0",
    "typescript": "^4.2.3",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "webpack-dev-server": "^4.15.1"
  },
  "dependencies": {
    "@types/three": "^0.131.1",
    "express": "^4.19.2",
    "socket.io": "^4.7.5",
    "socket.io-client": "^4.7.5",
    "three": "^0.132.2"
  }
}


================================================
File: /test/ReadyPlayerMeIntegaration/gpt.txt
================================================
charterControls.ts

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { W, A, S, D, ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, DIRECTIONS } from './utils';

export class CharacterControls {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    orbitControl: OrbitControls;
    camera: THREE.Camera;
    currentAction: string;
    animationsMap: Map<string, THREE.AnimationAction>;

    // state
    toggleRun = false;
    isJumping = false;
    jumpStartTime = 0;
    initialJumpVelocity = 2;
    gravity = -10;

    // temporary data
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuaternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();
    jumpVelocity = new THREE.Vector3(0, 0, 0); // Define jumpVelocity

    // constants
    runVelocity = 5;
    walkVelocity = 2;

    constructor(model: THREE.Group, mixer: THREE.AnimationMixer, orbitControl: OrbitControls, camera: THREE.Camera, animationsMap: Map<string, THREE.AnimationAction>, currentAction: string) {
        this.model = model;
        this.mixer = mixer;
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.playAnimation('Idle'); // Ensure initial animation is Idle
        this.updateCameraTarget(0, 0);
    }

    public update(delta: number, keysPressed: { [key: string]: boolean }) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);

        if (keysPressed[' ']) { // Space key for jump
            this.startJump();
        }

        if (this.isJumping) {
            this.updateJump(delta, keysPressed);
        } else if (directionPressed) {
            this.moveCharacter(delta, keysPressed);
        } else {
            if (this.currentAction !== 'Idle') {
                this.playAnimation('Idle');
            }
        }

        // Ensure character does not sink below the ground
        if (this.model.position.y < 0) {
            this.model.position.y = 0;
        }

        this.updateCameraTarget(0, 0);
    }

    private startJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpStartTime = performance.now();
            this.jumpVelocity.y = this.initialJumpVelocity;
            this.playAnimation('Jump'); // Assumes a jump animation is available
        }
    }

    private updateJump(delta: number, keysPressed: { [key: string]: boolean }) {
        const elapsedTime = (performance.now() - this.jumpStartTime) / 1000;
        const displacement = (this.initialJumpVelocity * elapsedTime) + (0.5 * this.gravity * Math.pow(elapsedTime, 2));
        this.model.position.y += displacement;

        if (this.model.position.y <= 0) {
            this.model.position.y = 0;
            this.isJumping = false;
            const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);
            if (directionPressed) {
                this.moveCharacter(delta, keysPressed);
            } else {
                this.playAnimation('Idle'); // Go back to Idle after landing
            }
        } else {
            // Allow horizontal movement while jumping
            this.moveCharacter(delta, keysPressed);
        }
    }

    private moveCharacter(delta: number, keysPressed: { [key: string]: boolean }) {
        // Check if shift is pressed
        this.toggleRun = keysPressed['shift'] === true;

        // calculate towards camera direction
        const angleYCameraDirection = Math.atan2(
            (this.camera.position.x - this.model.position.x),
            (this.camera.position.z - this.model.position.z)
        );
        // diagonal movement angle offset
        const directionOffset = this.directionOffset(keysPressed);

        // rotate model
        this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
        this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2);

        // calculate direction
        this.camera.getWorldDirection(this.walkDirection);
        this.walkDirection.y = 0;
        this.walkDirection.normalize();
        this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

        // run/walk velocity
        const velocity = this.toggleRun ? this.runVelocity : this.walkVelocity;

        // move model & camera
        const moveX = -this.walkDirection.x * velocity * delta;
        const moveZ = -this.walkDirection.z * velocity * delta;

        this.model.position.x += moveX;
        this.model.position.z += moveZ;

        this.updateCameraTarget(moveX, moveZ);

        // Update animation based on run/walk
        if (!this.isJumping) {  // Only change to walk/run animation if not jumping
            const newAction = this.toggleRun ? 'Run' : 'Walk';
            if (this.currentAction !== newAction) {
                this.playAnimation(newAction);
            }
        }
    }

    public playAnimation(actionName: string) {
        const action = this.animationsMap.get(actionName);
        if (action) {
            const current = this.animationsMap.get(this.currentAction);
            if (current) {
                current.fadeOut(0.2); // Smooth transition from the current animation
            }
            action.reset().fadeIn(0.2).play();
            this.currentAction = actionName; // Update current action state
        }
    }

    private updateCameraTarget(moveX: number, moveZ: number) {
        // move camera
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        // update camera target
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y + 1;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget;
    }

    private directionOffset(keysPressed: { [key: string]: boolean }) {
        let directionOffset = 0;

        if (keysPressed[W] || keysPressed[ARROW_UP]) {
            if (keysPressed[D] || keysPressed[ARROW_RIGHT]) {
                directionOffset = Math.PI / 4 + Math.PI / 2;
            } else if (keysPressed[A] || keysPressed[ARROW_LEFT]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2;
            } else {
                directionOffset = Math.PI;
            }
        } else if (keysPressed[S] || keysPressed[ARROW_DOWN]) {
            if (keysPressed[D] || keysPressed[ARROW_RIGHT]) {
                directionOffset = Math.PI / 4;
            } else if (keysPressed[A] || keysPressed[ARROW_LEFT]) {
                directionOffset = -Math.PI / 4;
            }
        } else if (keysPressed[D] || keysPressed[ARROW_RIGHT]) {
            directionOffset = Math.PI / 2;
        } else if (keysPressed[A] || keysPressed[ARROW_LEFT]) {
            directionOffset = -Math.PI / 2;
        }

        return directionOffset;
    }
}


index.ts
import { KeyDisplay } from './utils';
import { CharacterControls } from './characterControls';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// LIGHTS
light();

// FLOOR
generateFloor();

// MODEL
let characterControls: CharacterControls;
const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
let mixer: THREE.AnimationMixer;

gltfLoader.load('https://models.readyplayer.me/65893b0514f9f5f28e61d783.glb', function (gltf) {
    const model = gltf.scene;
    model.position.y = 0; // Set initial position closer to the ground
    model.traverse(function (object: THREE.Object3D) {
        if ((object as THREE.Mesh).isMesh) (object as THREE.Mesh).castShadow = true;
    });
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    // Load Walking Animation
    fbxLoader.load('models/Walking.fbx', function (walkFbx) {
        const walkAction = mixer.clipAction(walkFbx.animations[0]);
        console.log('Walk animation loaded', walkFbx.animations[0]);
        console.log('Walk action', walkAction);

        // Load Idle Animation
        fbxLoader.load('models/Idle.fbx', function (idleFbx) {
            const idleAction = mixer.clipAction(idleFbx.animations[0]);
            console.log('Idle animation loaded', idleFbx.animations[0]);
            console.log('Idle action', idleAction);

            // Load Run Animation
            fbxLoader.load('models/Run.fbx', function (runFbx) {
                const runAction = mixer.clipAction(runFbx.animations[0]);
                console.log('Run animation loaded', runFbx.animations[0]);
                console.log('Run action', runAction);

                // Load Jump Animation
                fbxLoader.load('models/Jump.fbx', function (jumpFbx) {
                    const jumpAction = mixer.clipAction(jumpFbx.animations[0]);
                    console.log('Jump animation loaded', jumpFbx.animations[0]);
                    console.log('Jump action', jumpAction);

                    const animationsMap = new Map<string, THREE.AnimationAction>();
                    animationsMap.set('Walk', walkAction);
                    animationsMap.set('Idle', idleAction);
                    animationsMap.set('Run', runAction);
                    animationsMap.set('Jump', jumpAction);

                    characterControls = new CharacterControls(model, mixer, orbitControls, camera, animationsMap, 'Idle');
                    characterControls.playAnimation('Idle');  // Start with Idle animation
                    console.log('Character controls initialized');
                }, undefined, function (error) {
                    console.error('Error loading Jump animation:', error);
                });
            }, undefined, function (error) {
                console.error('Error loading Run animation:', error);
            });
        }, undefined, function (error) {
            console.error('Error loading Idle animation:', error);
        });
    }, undefined, function (error) {
        console.error('Error loading Walk animation:', error);
    });
}, undefined, function (error) {
    console.error('Error loading model:', error);
});

// CONTROL KEYS
const keysPressed: { [key: string]: boolean } = {};
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = true;
    (keysPressed as any)[event.key] = true;
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = false;
    (keysPressed as any)[event.key] = false;
}, false);

const clock = new THREE.Clock();
// ANIMATE
function animate() {
    const delta = clock.getDelta();
    if (characterControls) {
        characterControls.update(delta, keysPressed);
    }
    if (mixer) {
        mixer.update(delta);
    }
    orbitControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition();
}
window.addEventListener('resize', onWindowResize);

function generateFloor() {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const sandBaseColor = textureLoader.load("./textures/sand/Sand 002_COLOR.jpg");
    const sandNormalMap = textureLoader.load("./textures/sand/Sand 002_NRM.jpg");
    const sandHeightMap = textureLoader.load("./textures/sand/Sand 002_DISP.jpg");
    const sandAmbientOcclusion = textureLoader.load("./textures/sand/Sand 002_OCC.jpg");

    const WIDTH = 80;
    const LENGTH = 80;

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial({
        map: sandBaseColor, normalMap: sandNormalMap,
        displacementMap: sandHeightMap, displacementScale: 0.1,
        aoMap: sandAmbientOcclusion
    });
    wrapAndRepeatTexture(material.map);
    wrapAndRepeatTexture(material.normalMap);
    wrapAndRepeatTexture(material.displacementMap);
    wrapAndRepeatTexture(material.aoMap);

    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.rotation.x = - Math.PI / 2;
    scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture) {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
}

function light() {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(- 60, 100, - 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}


utils.ts
export const W = 'w';
export const A = 'a';
export const S = 's';
export const D = 'd';
export const ARROW_UP = 'ArrowUp';
export const ARROW_DOWN = 'ArrowDown';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_RIGHT = 'ArrowRight';
export const SHIFT = 'shift';
export const DIRECTIONS = [W, A, S, D, ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT];

export class KeyDisplay {
    map: Map<string, HTMLDivElement> = new Map();

    constructor() {
        const w: HTMLDivElement = document.createElement("div");
        const a: HTMLDivElement = document.createElement("div");
        const s: HTMLDivElement = document.createElement("div");
        const d: HTMLDivElement = document.createElement("div");
        const arrowUp: HTMLDivElement = document.createElement("div");
        const arrowDown: HTMLDivElement = document.createElement("div");
        const arrowLeft: HTMLDivElement = document.createElement("div");
        const arrowRight: HTMLDivElement = document.createElement("div");
        const shift: HTMLDivElement = document.createElement("div");

        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(ARROW_UP, arrowUp);
        this.map.set(ARROW_DOWN, arrowDown);
        this.map.set(ARROW_LEFT, arrowLeft);
        this.map.set(ARROW_RIGHT, arrowRight);
        this.map.set(SHIFT, shift);

        this.map.forEach((v, k) => {
            v.style.color = 'blue';
            v.style.fontSize = '50px';
            v.style.fontWeight = '800';
            v.style.position = 'absolute';
            v.textContent = k;
        });

        this.updatePosition();

        this.map.forEach((v, _) => {
            document.body.append(v);
        });
    }

    public updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 200}px`;
        this.map.get(A).style.top = `${window.innerHeight - 150}px`;
        this.map.get(S).style.top = `${window.innerHeight - 150}px`;
        this.map.get(D).style.top = `${window.innerHeight - 150}px`;
        // this.map.get(ARROW_UP).style.top = `${window.innerHeight - 100}px`;
        // this.map.get(ARROW_DOWN).style.top = `${window.innerHeight - 50}px`;
        // this.map.get(ARROW_LEFT).style.top = `${window.innerHeight - 50}px`;
        // this.map.get(ARROW_RIGHT).style.top = `${window.innerHeight - 50}px`;
        this.map.get(SHIFT).style.top = `${window.innerHeight - 50}px`;

        this.map.get(W).style.left = `${100}px`;
        this.map.get(A).style.left = `${50}px`;
        this.map.get(S).style.left = `${100}px`;
        this.map.get(D).style.left = `${150}px`;
        this.map.get(ARROW_UP).style.left = `${300}px`;
        this.map.get(ARROW_DOWN).style.left = `${300}px`;
        this.map.get(ARROW_LEFT).style.left = `${250}px`;
        this.map.get(ARROW_RIGHT).style.left = `${350}px`;
        this.map.get(SHIFT).style.left = `${50}px`;
    }

    public down(key: string) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red';
        }
        if (this.map.get(key)) {
            this.map.get(key).style.color = 'red';
        }
    }

    public up(key: string) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue';
        }
        if (this.map.get(key)) {
            this.map.get(key).style.color = 'blue';
        }
    }
}


================================================
File: /test/ReadyPlayerMeIntegaration/webpack.config.js
================================================
const path = require('path');

const src = path.resolve(__dirname, 'src');

module.exports = {
  mode: 'development',
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'index.js',
    path: src
  },
  devServer: {
    static: src,
  },
}

================================================
File: /test/ReadyPlayerMeIntegaration/LICENSE
================================================
MIT License

Copyright (c) 2021 tamani-coding

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


================================================
File: /test/ReadyPlayerMeIntegaration/tsconfig.json
================================================
{
    "compilerOptions": {
      "outDir": "./dist/",
      "sourceMap": true,
      "noImplicitAny": true,
      "module": "CommonJS",
      "target": "es5",
      "allowJs": true
    }
}

================================================
File: /test/ReadyPlayerMeIntegaration/README.md
================================================
# threejs-character-controls-example

This project demonstrates character controls using Three.js, integrated with Ready Player Me avatars.

## Installation and Setup

1. Clone the repository:

    `git clone https://github.com/NagiPragalathan/ReadyPlayerMeIntegaration.git
    cd ReadyPlayerMeIntegaration` 
    
2. Install dependencies:

    `npm install` 
    
3. Start the development server:
    
    `npm run start` 
    
4. Open your browser and navigate to `http://localhost:3000` to see the example in action.
    

## Key Features

- **Character Controls**: Implemented in `characterControls.ts`, includes movement and interaction logic.
- **Ready Player Me Integration**: Integrates Ready Player Me avatars for 3D character representation.

## Usage

- Modify `characterControls.ts` for custom character control logic.
- Integrate different Ready Player Me avatars by modifying the avatar loading logic.

## Integration Code

Here's a snippet for integrating Ready Player Me avatars and animations:

`gltfLoader.load('https://models.readyplayer.me/65893b0514f9f5f28e61d783.glb', function (gltf) {
    const model = gltf.scene;
    model.position.y = 0; // Set initial position closer to the ground
    model.traverse(function (object) {
        if ((object as THREE.Mesh).isMesh) (object as THREE.Mesh).castShadow = true;
    });
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    // Load Walking Animation
    fbxLoader.load('models/Walking.fbx', function (walkFbx) {
        const walkAction = mixer.clipAction(walkFbx.animations[0]);

        // Load Idle Animation
        fbxLoader.load('models/Idle.fbx', function (idleFbx) {
            const idleAction = mixer.clipAction(idleFbx.animations[0]);

            // Load Run Animation
            fbxLoader.load('models/Run.fbx', function (runFbx) {
                const runAction = mixer.clipAction(runFbx.animations[0]);

                // Load Jump Animation
                fbxLoader.load('models/Jump.fbx', function (jumpFbx) {
                    const jumpAction = mixer.clipAction(jumpFbx.animations[0]);

                    const animationsMap = new Map<string, THREE.AnimationAction>();
                    animationsMap.set('Walk', walkAction);
                    animationsMap.set('Idle', idleAction);
                    animationsMap.set('Run', runAction);
                    animationsMap.set('Jump', jumpAction);

                    characterControls = new CharacterControls(model, mixer, orbitControls, camera, animationsMap, 'Idle');
                    characterControls.playAnimation('Idle');  // Start with Idle animation
                }, undefined, function (error) {
                    console.error('Error loading Jump animation:', error);
                });
            }, undefined, function (error) {
                console.error('Error loading Run animation:', error);
            });
        }, undefined, function (error) {
            console.error('Error loading Idle animation:', error);
        });
    }, undefined, function (error) {
        console.error('Error loading Walk animation:', error);
    });
}, undefined, function (error) {
    console.error('Error loading model:', error);
});` 

# Steps
 - Replace your link For : `https://models.readyplayer.me/65893b0514f9f5f28e61d783.glb`
 - And default models which is in models. for example models/Idle.fbx
   
## Try it Online

- Explore the example on [Stackblitz](https://stackblitz.com/github/tamani-coding/threejs-character-controls-example).

## Ready Player Me

Ready Player Me is a platform that allows the creation of customizable 3D avatars for use in various applications, including games and virtual environments. For more information, visit [Ready Player Me](https://readyplayer.me/).

## License

This project is licensed under the MIT License.


================================================
File: /test/ReadyPlayerMeIntegaration/src/index.html
================================================
<html>
<head>
    <meta charset="utf-8" />
    <title>Three.js Multiplayer Example</title>
    <style>
        body {
            margin: 0px;
        }
    </style>
</head>
<body>
    <script src="/socket.io/socket.io.js"></script>
    <script type="module" src="index.js"></script>
</body>
</html>


================================================
File: /test/ReadyPlayerMeIntegaration/src/characterControls.ts
================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { W, A, S, D, ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, DIRECTIONS } from './utils';

export class CharacterControls {
    model: THREE.Group;
    mixer: THREE.AnimationMixer;
    orbitControl: OrbitControls;
    camera: THREE.Camera;
    currentAction: string;
    animationsMap: Map<string, THREE.AnimationAction>;

    // state
    toggleRun = false;
    isJumping = false;
    jumpStartTime = 0;
    initialJumpVelocity = 2;
    gravity = -10;

    // temporary data
    walkDirection = new THREE.Vector3();
    rotateAngle = new THREE.Vector3(0, 1, 0);
    rotateQuaternion = new THREE.Quaternion();
    cameraTarget = new THREE.Vector3();
    jumpVelocity = new THREE.Vector3(0, 0, 0); // Define jumpVelocity

    // constants
    runVelocity = 5;
    walkVelocity = 2;

    constructor(model: THREE.Group, mixer: THREE.AnimationMixer, orbitControl: OrbitControls, camera: THREE.Camera, animationsMap: Map<string, THREE.AnimationAction>, currentAction: string) {
        this.model = model;
        this.mixer = mixer;
        this.orbitControl = orbitControl;
        this.camera = camera;
        this.animationsMap = animationsMap;
        this.currentAction = currentAction;
        this.playAnimation('Idle'); // Ensure initial animation is Idle
        this.updateCameraTarget(0, 0);
    }

    public update(delta: number, keysPressed: { [key: string]: boolean }) {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);

        if (keysPressed[' ']) { // Space key for jump
            this.startJump();
        }

        if (this.isJumping) {
            this.updateJump(delta, keysPressed);
        } else if (directionPressed) {
            this.moveCharacter(delta, keysPressed);
        } else {
            if (this.currentAction !== 'Idle') {
                this.playAnimation('Idle');
            }
        }

        // Ensure character does not sink below the ground
        if (this.model.position.y < 0) {
            this.model.position.y = 0;
        }

        this.updateCameraTarget(0, 0);
    }

    private startJump() {
        if (!this.isJumping) {
            this.isJumping = true;
            this.jumpStartTime = performance.now();
            this.jumpVelocity.y = this.initialJumpVelocity;
            this.playAnimation('Jump'); // Assumes a jump animation is available
        }
    }

    private updateJump(delta: number, keysPressed: { [key: string]: boolean }) {
        const elapsedTime = (performance.now() - this.jumpStartTime) / 1000;
        const displacement = (this.initialJumpVelocity * elapsedTime) + (0.5 * this.gravity * Math.pow(elapsedTime, 2));
        this.model.position.y += displacement;

        if (this.model.position.y <= 0) {
            this.model.position.y = 0;
            this.isJumping = false;
            const directionPressed = DIRECTIONS.some(key => keysPressed[key] === true);
            if (directionPressed) {
                this.moveCharacter(delta, keysPressed);
            } else {
                this.playAnimation('Idle'); // Go back to Idle after landing
            }
        } else {
            // Allow horizontal movement while jumping
            this.moveCharacter(delta, keysPressed);
        }
    }

    private moveCharacter(delta: number, keysPressed: { [key: string]: boolean }) {
        // Check if shift is pressed
        this.toggleRun = keysPressed['shift'] === true;

        // calculate towards camera direction
        const angleYCameraDirection = Math.atan2(
            (this.camera.position.x - this.model.position.x),
            (this.camera.position.z - this.model.position.z)
        );
        // diagonal movement angle offset
        const directionOffset = this.directionOffset(keysPressed);

        // rotate model
        this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
        this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2);

        // calculate direction
        this.camera.getWorldDirection(this.walkDirection);
        this.walkDirection.y = 0;
        this.walkDirection.normalize();
        this.walkDirection.applyAxisAngle(this.rotateAngle, directionOffset);

        // run/walk velocity
        const velocity = this.toggleRun ? this.runVelocity : this.walkVelocity;

        // move model & camera
        const moveX = -this.walkDirection.x * velocity * delta;
        const moveZ = -this.walkDirection.z * velocity * delta;

        this.model.position.x += moveX;
        this.model.position.z += moveZ;

        this.updateCameraTarget(moveX, moveZ);

        // Update animation based on run/walk
        if (!this.isJumping) {  // Only change to walk/run animation if not jumping
            const newAction = this.toggleRun ? 'Run' : 'Walk';
            if (this.currentAction !== newAction) {
                this.playAnimation(newAction);
            }
        }
    }

    public playAnimation(actionName: string) {
        const action = this.animationsMap.get(actionName);
        if (action) {
            const current = this.animationsMap.get(this.currentAction);
            if (current) {
                current.fadeOut(0.2); // Smooth transition from the current animation
            }
            action.reset().fadeIn(0.2).play();
            this.currentAction = actionName; // Update current action state
        }
    }

    private updateCameraTarget(moveX: number, moveZ: number) {
        // move camera
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        // update camera target
        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y + 1;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControl.target = this.cameraTarget;
    }

    private directionOffset(keysPressed: { [key: string]: boolean }) {
        let directionOffset = 0;

        if (keysPressed[W] || keysPressed[ARROW_UP]) {
            if (keysPressed[D] || keysPressed[ARROW_RIGHT]) {
                directionOffset = Math.PI / 4 + Math.PI / 2;
            } else if (keysPressed[A] || keysPressed[ARROW_LEFT]) {
                directionOffset = -Math.PI / 4 - Math.PI / 2;
            } else {
                directionOffset = Math.PI;
            }
        } else if (keysPressed[S] || keysPressed[ARROW_DOWN]) {
            if (keysPressed[D] || keysPressed[ARROW_RIGHT]) {
                directionOffset = Math.PI / 4;
            } else if (keysPressed[A] || keysPressed[ARROW_LEFT]) {
                directionOffset = -Math.PI / 4;
            }
        } else if (keysPressed[D] || keysPressed[ARROW_RIGHT]) {
            directionOffset = Math.PI / 2;
        } else if (keysPressed[A] || keysPressed[ARROW_LEFT]) {
            directionOffset = -Math.PI / 2;
        }

        return directionOffset;
    }
}


================================================
File: /test/ReadyPlayerMeIntegaration/src/utils.ts
================================================
export const W = 'w';
export const A = 'a';
export const S = 's';
export const D = 'd';
export const ARROW_UP = 'ArrowUp';
export const ARROW_DOWN = 'ArrowDown';
export const ARROW_LEFT = 'ArrowLeft';
export const ARROW_RIGHT = 'ArrowRight';
export const SHIFT = 'shift';
export const DIRECTIONS = [W, A, S, D, ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT];

export class KeyDisplay {
    map: Map<string, HTMLDivElement> = new Map();

    constructor() {
        const w: HTMLDivElement = document.createElement("div");
        const a: HTMLDivElement = document.createElement("div");
        const s: HTMLDivElement = document.createElement("div");
        const d: HTMLDivElement = document.createElement("div");
        const arrowUp: HTMLDivElement = document.createElement("div");
        const arrowDown: HTMLDivElement = document.createElement("div");
        const arrowLeft: HTMLDivElement = document.createElement("div");
        const arrowRight: HTMLDivElement = document.createElement("div");
        const shift: HTMLDivElement = document.createElement("div");

        this.map.set(W, w);
        this.map.set(A, a);
        this.map.set(S, s);
        this.map.set(D, d);
        this.map.set(ARROW_UP, arrowUp);
        this.map.set(ARROW_DOWN, arrowDown);
        this.map.set(ARROW_LEFT, arrowLeft);
        this.map.set(ARROW_RIGHT, arrowRight);
        this.map.set(SHIFT, shift);

        this.map.forEach((v, k) => {
            v.style.color = 'blue';
            v.style.fontSize = '50px';
            v.style.fontWeight = '800';
            v.style.position = 'absolute';
            v.textContent = k;
        });

        this.updatePosition();

        this.map.forEach((v, _) => {
            document.body.append(v);
        });
    }

    public updatePosition() {
        this.map.get(W).style.top = `${window.innerHeight - 200}px`;
        this.map.get(A).style.top = `${window.innerHeight - 150}px`;
        this.map.get(S).style.top = `${window.innerHeight - 150}px`;
        this.map.get(D).style.top = `${window.innerHeight - 150}px`;
        // this.map.get(ARROW_UP).style.top = `${window.innerHeight - 100}px`;
        // this.map.get(ARROW_DOWN).style.top = `${window.innerHeight - 50}px`;
        // this.map.get(ARROW_LEFT).style.top = `${window.innerHeight - 50}px`;
        // this.map.get(ARROW_RIGHT).style.top = `${window.innerHeight - 50}px`;
        this.map.get(SHIFT).style.top = `${window.innerHeight - 50}px`;

        this.map.get(W).style.left = `${100}px`;
        this.map.get(A).style.left = `${50}px`;
        this.map.get(S).style.left = `${100}px`;
        this.map.get(D).style.left = `${150}px`;
        this.map.get(ARROW_UP).style.left = `${300}px`;
        this.map.get(ARROW_DOWN).style.left = `${300}px`;
        this.map.get(ARROW_LEFT).style.left = `${250}px`;
        this.map.get(ARROW_RIGHT).style.left = `${350}px`;
        this.map.get(SHIFT).style.left = `${50}px`;
    }

    public down(key: string) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'red';
        }
        if (this.map.get(key)) {
            this.map.get(key).style.color = 'red';
        }
    }

    public up(key: string) {
        if (this.map.get(key.toLowerCase())) {
            this.map.get(key.toLowerCase()).style.color = 'blue';
        }
        if (this.map.get(key)) {
            this.map.get(key).style.color = 'blue';
        }
    }
}


================================================
File: /test/ReadyPlayerMeIntegaration/src/index.ts
================================================
import { KeyDisplay } from './utils';
import { CharacterControls } from './characterControls';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05;
orbitControls.update();

// LIGHTS
light();

// FLOOR
generateFloor();

// MODEL
let characterControls: CharacterControls;
const gltfLoader = new GLTFLoader();
const fbxLoader = new FBXLoader();
let mixer: THREE.AnimationMixer;

// Store other players and their mixers
const otherPlayers: { [id: string]: THREE.Group } = {};
const otherMixers: { [id: string]: THREE.AnimationMixer } = {};
const otherActions: { [id: string]: { current: THREE.AnimationAction | null, map: Map<string, THREE.AnimationAction> } } = {};

gltfLoader.load('https://models.readyplayer.me/65893b0514f9f5f28e61d783.glb', function (gltf) {
    const model = gltf.scene;
    model.position.y = 0;
    model.traverse(function (object) {
        if ((object as THREE.Mesh).isMesh) (object as THREE.Mesh).castShadow = true;
    });
    scene.add(model);

    mixer = new THREE.AnimationMixer(model);

    // Load Dance Animation
    gltfLoader.load('models/M_Dances_003.glb', function (danceGltf) {
        const danceAction = mixer.clipAction(danceGltf.animations[0]);
        
        const animationsMap = new Map<string, THREE.AnimationAction>();
        animationsMap.set('Dance', danceAction);
        
        characterControls = new CharacterControls(model, mixer, orbitControls, camera, animationsMap, 'Dance');
        characterControls.playAnimation('Dance');  // Start with Dance animation
    }, undefined, function (error) {
        console.error('Error loading Dance animation:', error);
    });
}, undefined, function (error) {
    console.error('Error loading model:', error);
});

// CONTROL KEYS
const keysPressed: { [key: string]: boolean } = {};
const keyDisplayQueue = new KeyDisplay();
document.addEventListener('keydown', (event) => {
    keyDisplayQueue.down(event.key);
    keysPressed[event.key.toLowerCase()] = true;
    keysPressed[event.key] = true;
}, false);
document.addEventListener('keyup', (event) => {
    keyDisplayQueue.up(event.key);
    keysPressed[event.key.toLowerCase()] = false;
    keysPressed[event.key] = false;
}, false);

const clock = new THREE.Clock();
// ANIMATE
function animate(): void {
    const delta = clock.getDelta();
    if (characterControls) {
        characterControls.update(delta, keysPressed);
    }
    if (mixer) {
        mixer.update(delta);
    }

    orbitControls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
document.body.appendChild(renderer.domElement);
animate();

// RESIZE HANDLER
function onWindowResize(): void {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    keyDisplayQueue.updatePosition();
}
window.addEventListener('resize', onWindowResize);

function generateFloor(): void {
    // TEXTURES
    const textureLoader = new THREE.TextureLoader();
    const sandBaseColor = textureLoader.load("./textures/sand/Sand 002_COLOR.jpg");
    const sandNormalMap = textureLoader.load("./textures/sand/Sand 002_NRM.jpg");
    const sandHeightMap = textureLoader.load("./textures/sand/Sand 002_DISP.jpg");
    const sandAmbientOcclusion = textureLoader.load("./textures/sand/Sand 002_OCC.jpg");

    const WIDTH = 80;
    const LENGTH = 80;

    const geometry = new THREE.PlaneGeometry(WIDTH, LENGTH, 512, 512);
    const material = new THREE.MeshStandardMaterial({
        map: sandBaseColor, normalMap: sandNormalMap,
        displacementMap: sandHeightMap, displacementScale: 0.1,
        aoMap: sandAmbientOcclusion
    });
    wrapAndRepeatTexture(material.map);
    wrapAndRepeatTexture(material.normalMap);
    wrapAndRepeatTexture(material.displacementMap);
    wrapAndRepeatTexture(material.aoMap);

    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.rotation.x = - Math.PI / 2;
    scene.add(floor);
}

function wrapAndRepeatTexture(map: THREE.Texture): void {
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.x = map.repeat.y = 10;
}

function light(): void {
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(- 60, 100, - 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = - 50;
    dirLight.shadow.camera.left = - 50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 200;
    dirLight.shadow.mapSize.width = 4096;
    dirLight.shadow.mapSize.height = 4096;
    scene.add(dirLight);
    // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}


================================================
File: /package.json
================================================
{
  "name": "my-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@react-three/drei": "^9.120.4",
    "@react-three/fiber": "^8.17.10",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "three": "^0.171.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.17.0",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "eslint": "^9.17.0",
    "eslint-plugin-react": "^7.37.2",
    "eslint-plugin-react-hooks": "^5.0.0",
    "eslint-plugin-react-refresh": "^0.4.16",
    "globals": "^15.14.0",
    "vite": "^6.0.5"
  }
}


================================================
File: /vite.config.js
================================================
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})


================================================
File: /src/App.jsx
================================================
import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedModel() {
  const group = useRef(); // Ref for the parent group
  const mixer = useRef(); // Animation mixer
  const clock = useRef(new THREE.Clock());

  // Load the model and animation from separate URLs
  const { scene, animations } = useGLTF('https://models.readyplayer.me/657338d4245f556b8079f81e.glb');
  const { animations: danceAnimations } = useGLTF('/M_Dances_003.glb');

  useEffect(() => {
    if (!danceAnimations || danceAnimations.length === 0) {
      console.error('No dance animations found in the GLB file.');
      return;
    }

    // Create an AnimationMixer for the scene
    mixer.current = new THREE.AnimationMixer(scene);

    // Play the first animation from danceAnimations
    const action = mixer.current.clipAction(danceAnimations[0]);
    action.reset().play();

    // Cleanup function to stop animations
    return () => {
      if (mixer.current) {
        mixer.current.stopAllAction();
        mixer.current.uncacheRoot(scene);
      }
    };
  }, [scene, danceAnimations]);

  useEffect(() => {
    const animate = () => {
      const delta = clock.current.getDelta(); // Get the time delta
      if (mixer.current) mixer.current.update(delta); // Update the mixer
      requestAnimationFrame(animate); // Loop the animation
    };

    animate();

    return () => cancelAnimationFrame(animate);
  }, []);

  return <primitive object={scene} ref={group} scale={1.5} />;
}

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        
        {/* Animated Model */}
        <AnimatedModel />

        {/* Camera Controls */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}

export default App;


================================================
File: /src/index.css
================================================
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;

  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

a {
  font-weight: 500;
  color: #646cff;
  text-decoration: inherit;
}
a:hover {
  color: #535bf2;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

h1 {
  font-size: 3.2em;
  line-height: 1.1;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  cursor: pointer;
  transition: border-color 0.25s;
}
button:hover {
  border-color: #646cff;
}
button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}

@media (prefers-color-scheme: light) {
  :root {
    color: #213547;
    background-color: #ffffff;
  }
  a:hover {
    color: #747bff;
  }
  button {
    background-color: #f9f9f9;
  }
}


================================================
File: /src/main.jsx
================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


================================================
File: /src/App.css
================================================
#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.react:hover {
  filter: drop-shadow(0 0 2em #61dafbaa);
}

@keyframes logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: no-preference) {
  a:nth-of-type(2) .logo {
    animation: logo-spin infinite 20s linear;
  }
}

.card {
  padding: 2em;
}

.read-the-docs {
  color: #888;
}


