import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export default function App() {
  const domElement = useRef();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(mount, []);

  function mount() {
    const renderer = new THREE.WebGLRenderer({
      canvas: domElement.current,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();

    window.addEventListener('resize', resize);

    resize();

    renderer.setAnimationLoop(update);
    requestAnimationFrame(() => setIsMounted(true));

    return unmount;

    function unmount() {
      renderer.setAnimationLoop(null);
    }

    function resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function update(elapsed) {
      renderer.render(scene, camera);
    }
  }

  return (
    <canvas className={[isMounted ? 'ready' : ''].join(' ')} ref={domElement} />
  );
}
