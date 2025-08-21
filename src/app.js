import {
  Color,
  WebGLRenderer,
  Scene,
  Group,
  PerspectiveCamera,
  Fog,
  HemisphereLight,
  DirectionalLight,
  ShaderChunk,
  PCFSoftShadowMap,
} from 'three';
import { Token } from './token.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const TWO_PI = Math.PI * 2;
const background = 0xbbccbb;
const color = new Color();
const isMobile = navigator.maxTouchPoints > 0;
let isMounted = false;

ShaderChunk.shadowmap_pars_fragment.replace(
  '#ifdef USE_SHADOWMAP',
  `#ifdef USE_SHADOWMAP
  #define LIGHT_WORLD_SIZE 0.005
  #define LIGHT_FRUSTUM_WIDTH 3.75
  #define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
  #define NEAR_PLANE 9.5

  #define NUM_SAMPLES 17
  #define NUM_RINGS 11
  #define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES

  vec2 poissonDisk[NUM_SAMPLES];

  void initPoissonSamples( const in vec2 randomSeed ) {
    float ANGLE_STEP = PI2 * float( NUM_RINGS ) / float( NUM_SAMPLES );
    float INV_NUM_SAMPLES = 1.0 / float( NUM_SAMPLES );

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    float angle = rand( randomSeed ) * PI2;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;

    for( int i = 0; i < NUM_SAMPLES; i ++ ) {
      poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
      radius += radiusStep;
      angle += ANGLE_STEP;
    }
  }

  float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
    return (zReceiver - zBlocker) / zBlocker;
  }

  float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver ) {
    // This uses similar triangles to compute what
    // area of the shadow map we should search
    float searchRadius = LIGHT_SIZE_UV * ( zReceiver - NEAR_PLANE ) / zReceiver;
    float blockerDepthSum = 0.0;
    int numBlockers = 0;

    for( int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++ ) {
      float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
      if ( shadowMapDepth < zReceiver ) {
        blockerDepthSum += shadowMapDepth;
        numBlockers ++;
      }
    }

    if( numBlockers == 0 ) return -1.0;

    return blockerDepthSum / float( numBlockers );
  }

  float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
    float sum = 0.0;
    float depth;
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
      depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
      if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
      depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
      if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( 17 ) );
  }

  float PCSS ( sampler2D shadowMap, vec4 coords ) {
    vec2 uv = coords.xy;
    float zReceiver = coords.z; // Assumed to be eye-space z in this code

    initPoissonSamples( uv );
    // STEP 1: blocker search
    float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver );

    //There are no occluders so early out (this saves filtering)
    if( avgBlockerDepth == -1.0 ) return 1.0;

    // STEP 2: penumbra size
    float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
    float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;

    // STEP 3: filtering
    //return avgBlockerDepth;
    return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
  }`
);

ShaderChunk.shadowmap_pars_fragment.replace(
  '#if defined( SHADOWMAP_TYPE_PCF )',
  `return PCSS( shadowMap, shadowCoord );
  #if defined( SHADOWMAP_TYPE_PCF )`
);

export default function App(domElement) {
  if (!isMounted) {
    return mount();
  }

  function mount() {
    const renderer = new WebGLRenderer();
    const scene = new Scene();
    const group = new Group();
    const camera = new PerspectiveCamera(50);
    let scrollY = 0;
    let isScrolling = false;
    let scrollTimeout;

    renderer.setClearColor(background);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;
    camera.position.z = 10;
    scene.fog = new Fog(background, camera.position.z, camera.position.z + 4);
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

    const hemiLight = new HemisphereLight(background, background, 2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);

    const dirLight = new DirectionalLight(background, 3);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, 2, -0.5);
    dirLight.position.multiplyScalar(15);
    scene.add(dirLight);

    dirLight.shadow.mapSize.width = isMobile ? 512 : 2048;
    dirLight.shadow.mapSize.height = isMobile ? 512 : 2048;

    const dist = 1;

    dirLight.shadow.camera.left = -dist;
    dirLight.shadow.camera.right = dist;
    dirLight.shadow.camera.top = dist;
    dirLight.shadow.camera.bottom = -dist;

    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.bias = -0.001;
    dirLight.castShadow = true;

    domElement.appendChild(renderer.domElement);
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();

    renderer.setAnimationLoop(update);
    return unmount;

    function unmount() {
      domElement.removeChild(renderer.domElement);
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      composer.dispose();
    }

    function onScroll() {
      scrollY = window.scrollY;
      if (!isScrolling) {
        isScrolling = true;
        resize();
        update();
      }
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 100);
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
      if (group.children.length < 50) {
        h = clamp(baseHue + 0.5 * Math.random() - 0.25, 0, 1);
        s = 1;
        l = 0.5 * Math.random() + 0.5;
        const top = '#' + color.setHSL(h, s, l).getHexString();

        h = mod(h + 0.5 * Math.random() - 0.25, 1);
        l = clamp(l - Math.random() * 0.25, 0, 1);
        const bottom = '#' + color.setHSL(h, s, l).getHexString();

        const token = new Token([top, bottom]);

        // Use Three.js built-in bounding sphere calculation
        token.geometry.computeBoundingSphere();
        const boundingSphereRadius = token.geometry.boundingSphere.radius;

        // Ensure minimum distance from camera considering near plane
        const cameraDistance = camera.position.z;
        const nearPlane = camera.near || 0.1;
        const minDistanceFromCamera = nearPlane + boundingSphereRadius;
        const maxDistanceFromCamera = cameraDistance - minDistanceFromCamera;

        // Generate random position within spherical volume, ensuring minimum distance
        const phi = Math.random() * TWO_PI;
        const theta = Math.random() * Math.PI;
        const radius = Math.pow(Math.random(), 0.3) * maxDistanceFromCamera;

        token.position.setFromSphericalCoords(radius, phi, theta);

        token.rotation.x = Math.random() * TWO_PI;
        token.rotation.y = Math.random() * TWO_PI;
        token.rotation.z = Math.random() * TWO_PI;

        group.add(token);
      } else if (!isMounted) {
        requestAnimationFrame(() => {
          domElement.classList.add('ready');
          isMounted = true;
        });
      }
      camera.position.y -= (scrollY * 0.001 + camera.position.y) * 0.3;
      if (typeof elapsed === 'number') {
        group.rotation.y = (-0.01 * elapsed) / 1000;
      }
      composer.render();
    }
  }
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
