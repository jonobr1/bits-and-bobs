import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Token } from './token.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TWO_PI = Math.PI * 2;
const background = 0xbbccbb;
const color = new THREE.Color();
const isMobile = navigator.maxTouchPoints > 0;

export default function App() {
  const domElement = useRef();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(mount, []);

  function mount() {
    const renderer = new THREE.WebGLRenderer({
      canvas: domElement.current,
    });
    const scene = new THREE.Scene();
    const group = new THREE.Group();
    const camera = new THREE.PerspectiveCamera(50);

    renderer.setClearColor(background);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    camera.position.z = 10;
    scene.fog = new THREE.Fog(
      background,
      camera.position.z,
      camera.position.z + 4
    );
    scene.add(group);

    const composer = new EffectComposer(renderer);
    const fxaa = new ShaderPass(FXAAShader);
    const bokeh = new BokehPass(scene, camera, {
      focus: 5,
      aperture: 0.001,
      maxblur: 0.02,
    });

    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(fxaa);
    composer.addPass(bokeh);
    composer.addPass(new OutputPass());

    let h, s, l;
    const baseHue = Math.random();
    for (let i = 0; i < 250; i++) {
      h = clamp(baseHue + 0.5 * Math.random() - 0.25, 0, 1);
      s = 1;
      l = 0.5 * Math.random() + 0.5;
      const top = '#' + color.setHSL(h, s, l).getHexString();

      h = mod(h + 0.5 * Math.random() - 0.25, 1);
      l = clamp(l - Math.random() * 0.25, 0, 1);
      const bottom = '#' + color.setHSL(h, s, l).getHexString();

      const token = new Token([top, bottom]);

      token.position.x = 9 * (2 * Math.random() - 1);
      token.position.y = 9 * (2 * Math.random() - 1);
      token.position.z = 9 * (2 * Math.random() - 1);

      token.rotation.x = Math.random() * TWO_PI;
      token.rotation.y = Math.random() * TWO_PI;
      token.rotation.z = Math.random() * TWO_PI;

      group.add(token);
    }

    const hemiLight = new THREE.HemisphereLight(background, background, 2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(background, 3);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);

    dirLight.shadow.mapSize.width = isMobile ? 256 : 1024;
    dirLight.shadow.mapSize.height = isMobile ? 256 : 1024;
    dirLight.castShadow = true;

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
      composer.setSize(width, height);
      fxaa.uniforms.resolution.value.x = 1 / width;
      fxaa.uniforms.resolution.value.y = 1 / height;
    }

    function update(elapsed) {
      camera.position.y = -window.scrollY * 0.001;
      group.rotation.y = (-0.01 * elapsed) / 1000;
      composer.render();
    }
  }

  return (
    <canvas className={[isMounted ? 'ready' : ''].join(' ')} ref={domElement} />
  );
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function mod(v, l) {
  while (v < 0) {
    v += l;
  }
  return v % l;
}
