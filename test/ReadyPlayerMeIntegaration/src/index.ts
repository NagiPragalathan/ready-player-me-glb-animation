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
