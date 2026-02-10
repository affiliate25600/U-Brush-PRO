import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Global

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

camera.position.z = 5;

// Main renderer

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById("three"),
    alpha: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const loader = new GLTFLoader();

loader.load("/U-Brush-PRO.glb", function (gltf) {
    const model = gltf.scene;

    model.scale.set(1.4, 1.4, 1.4);
    model.rotation.z = 0.35;

    scene.add(model);

    const pointLight1 = new THREE.PointLight( 0xffffff, 1, 0, 0);
    pointLight1.position.set(0, 3, 3);
    scene.add(pointLight1);

    window.animate = () => {
        model.rotation.y = Math.sin(window.screenHeightScrollPercent * 2) / 2 + 180;

        renderer.render( scene, camera );
    }

    window.animate();
});