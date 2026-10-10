// Shared product viewer for the model-based demos: renderer, HDRI lighting, glTF loading
// (with KHR_materials_variants), shadows, pointer and scroll helpers.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";

export { THREE };
export const capture = location.search.includes("capture");
export const mobile = () => innerWidth < 760;

export function createViewer({ canvas, fov = 30, exposure = 1, toneMapping = THREE.NeutralToneMapping, shadows = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = toneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = shadows;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 200);
  const frameFns = [], resizeFns = [], mixers = [];
  const gltfLoader = new GLTFLoader();

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    resizeFns.forEach((fn) => fn());
  }
  addEventListener("resize", resize);

  async function loadEnvironment(url, { intensity = 1, rotationY = 0, background = false, blur = 0 } = {}) {
    const tex = await new RGBELoader().loadAsync(url);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = tex;
    scene.environmentIntensity = intensity;
    scene.environmentRotation.y = rotationY;
    if (background) { scene.background = tex; scene.backgroundBlurriness = blur; scene.backgroundRotation.y = rotationY; }
    return tex;
  }

  // Loads a glTF, scales its largest side to `size`, centers it on x/z and stands it on y = 0.
  function loadModel(url, { size = 1, center = "ground", castShadow = true, onProgress } = {}) {
    return new Promise((resolve, reject) => {
      gltfLoader.load(url, (gltf) => {
        const root = gltf.scene;
        root.traverse((o) => { if (o.isMesh) { o.castShadow = castShadow; o.receiveShadow = true; } });
        const box = new THREE.Box3().setFromObject(root), v = new THREE.Vector3();
        root.scale.multiplyScalar(size / Math.max(...box.getSize(v).toArray()));
        box.setFromObject(root);
        const c = box.getCenter(v);
        root.position.x -= c.x; root.position.z -= c.z;
        root.position.y -= center === "ground" ? box.min.y : c.y;
        const holder = new THREE.Group();
        holder.add(root); scene.add(holder);

        const ext = gltf.userData.gltfExtensions?.KHR_materials_variants;
        const variants = ext ? ext.variants.map((x) => x.name) : [];
        // Swap every mesh to the material mapped for this variant (same approach as three.js' variants example).
        async function setVariant(name) {
          const index = variants.indexOf(name);
          const jobs = [];
          root.traverse((o) => {
            const data = o.isMesh && o.userData.gltfExtensions?.KHR_materials_variants;
            if (!data) return;
            o.userData.originalMaterial ??= o.material;
            const mapping = data.mappings.find((m) => m.variants.includes(index));
            if (mapping) jobs.push(gltf.parser.getDependency("material", mapping.material).then((m) => { o.material = m; gltf.parser.assignFinalMaterial(o); }));
            else o.material = o.userData.originalMaterial;
          });
          await Promise.all(jobs);
        }

        let mixer = null;
        if (gltf.animations.length) {
          mixer = new THREE.AnimationMixer(root);
          gltf.animations.forEach((a) => mixer.clipAction(a).play());
          mixers.push(mixer);
        }
        resolve({ gltf, root, holder, variants, setVariant, mixer, find: (n) => root.getObjectByName(n) });
      }, (e) => onProgress && e.total && onProgress(e.loaded / e.total), reject);
    });
  }

  // Directional light that casts a soft shadow onto an invisible ground.
  function addShadowLight({ position = [2, 5, 3], intensity = 1.5, color = 0xffffff, area = 2, opacity = 0.35, groundY = 0 } = {}) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = -0.0004; light.shadow.normalBias = 0.02;
    Object.assign(light.shadow.camera, { left: -area, right: area, top: area, bottom: -area, near: 0.1, far: 30 });
    scene.add(light);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(area * 4, area * 4), new THREE.ShadowMaterial({ opacity }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = groundY; ground.receiveShadow = true;
    scene.add(ground);
    return { light, ground };
  }

  // Soft blurred "contact" shadow: a radial gradient under the object.
  function addBlobShadow({ width = 1, depth = 0.5, opacity = 0.5, y = 0.001 } = {}) {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d"), grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, `rgba(0,0,0,${opacity})`); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = y;
    scene.add(m);
    return m;
  }

  const clock = new THREE.Clock();
  function start() {
    resize();
    renderer.setAnimationLoop(() => {
      const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
      mixers.forEach((m) => m.update(dt));
      frameFns.forEach((fn) => fn(t, dt));
      renderer.render(scene, camera);
    });
  }

  return {
    renderer, scene, camera, loadEnvironment, loadModel, addShadowLight, addBlobShadow, start, resize,
    onFrame: (fn) => frameFns.push(fn), onResize: (fn) => resizeFns.push(fn),
  };
}

// Smoothed pointer in -0.5..0.5
export const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
addEventListener("pointermove", (e) => { pointer.x = e.clientX / innerWidth - 0.5; pointer.y = e.clientY / innerHeight - 0.5; });
export function updatePointer(k = 0.06) { pointer.sx += (pointer.x - pointer.sx) * k; pointer.sy += (pointer.y - pointer.sy) * k; }

// Smoothed page scroll progress 0..1
const sp = { raw: 0, value: 0 };
export function scrollProgress(k = 0.08) {
  const max = document.documentElement.scrollHeight - innerHeight;
  sp.raw = max > 0 ? scrollY / max : 0;
  sp.value += (sp.raw - sp.value) * k;
  return sp.value;
}

// Loader overlay: call with 0..1, hides itself at 1.
export function progressUI(el) {
  return (p) => {
    if (!el) return;
    el.querySelector("[data-pct]").textContent = Math.round(p * 100) + "%";
    if (p >= 1 && capture) el.remove(); // screenshots: no fade
    else if (p >= 1) { el.classList.add("done"); setTimeout(() => el.remove(), 900); }
  };
}

export const lerp = THREE.MathUtils.lerp, smooth = (x) => x * x * (3 - 2 * x), clamp01 = (x) => Math.min(1, Math.max(0, x));
// 0..1 progress inside [a, b] of a larger 0..1 range
export const segment = (p, a, b) => smooth(clamp01((p - a) / (b - a)));
