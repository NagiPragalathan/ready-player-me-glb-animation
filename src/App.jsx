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
