// Animated full-screen backgrounds, ported from React Bits (https://reactbits.dev) to plain three.js.
//
// MIT + Commons Clause License Condition v1.0 — Copyright (c) 2026 David Haz
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without restriction,
// including without limitation the rights to use, copy, modify, merge, publish, and distribute the
// Software as part of an application, website, or product, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or
// substantial portions of the Software.
// Commons Clause: you may use this Software, including for any commercial purpose, so long as you
// do not sell, sublicense, or redistribute the components themselves — whether alone, in a bundle,
// or as a ported version.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
import * as THREE from "three";

function fullscreen(canvas, fragmentShader, uniforms, { dpr = 1.5 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, dpr));
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uRes: { value: new THREE.Vector2() }, ...uniforms },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const resize = () => {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false); material.uniforms.uRes.value.set(w, h);
  };
  addEventListener("resize", resize); resize();
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => { material.uniforms.uTime.value = clock.getElapsedTime(); renderer.render(scene, camera); });
  return { renderer, uniforms: material.uniforms };
}

// Silk: flowing satin folds with film grain. React Bits "Silk".
export function silk(canvas, { color = "#7B7481", speed = 5, scale = 1, noise = 1.5, rotation = 0, light = false } = {}) {
  const bg = fullscreen(canvas, /* glsl */`
    varying vec2 vUv;
    uniform float uTime, uSpeed, uScale, uRotation, uNoiseIntensity, uLightMode;
    uniform vec3 uColor; uniform vec2 uRes;
    const float e = 2.71828182845904523536;
    float noise(vec2 texCoord) { float G = e; vec2 r = (G * sin(G * texCoord)); return fract(r.x * r.y * (1.0 + texCoord.x)); }
    vec2 rotateUvs(vec2 uv, float angle) { float c = cos(angle), s = sin(angle); return mat2(c, -s, s, c) * uv; }
    void main() {
      float rnd = noise(gl_FragCoord.xy);
      vec2 aspect = vec2(uRes.x / uRes.y, 1.0);
      vec2 uv = rotateUvs(vUv * aspect * uScale, uRotation);
      vec2 tex = uv * uScale;
      float tOffset = uSpeed * uTime * 0.1;
      tex.y += 0.03 * sin(8.0 * tex.x - tOffset);
      float pattern = 0.6 + 0.4 * sin(5.0 * (tex.x + tex.y + cos(3.0 * tex.x + 5.0 * tex.y) + 0.02 * tOffset) + sin(20.0 * (tex.x + tex.y - 0.1 * tOffset)));
      float grain = rnd / 15.0 * uNoiseIntensity;
      vec3 result = uColor * pattern - vec3(grain);
      if (uLightMode > 0.5) {
        float fold = smoothstep(0.28, 0.9, pattern), specular = smoothstep(0.72, 0.98, pattern);
        vec3 lightBase = mix(uColor * 0.72, min(uColor * 1.18, vec3(1.0)), fold);
        lightBase = mix(lightBase, vec3(1.0), specular * 0.92);
        float fineNoise = noise(gl_FragCoord.xy * 0.63 + vec2(17.0, 41.0));
        result = lightBase + (rnd + fineNoise - 1.0) * clamp(uNoiseIntensity * 0.038, 0.0, 0.16);
      }
      gl_FragColor = vec4(clamp(result, 0.0, 1.0), 1.0);
    }`, {
    uColor: { value: new THREE.Color(color) }, uSpeed: { value: speed }, uScale: { value: scale },
    uNoiseIntensity: { value: noise }, uRotation: { value: rotation }, uLightMode: { value: light ? 1 : 0 },
  });
  return { ...bg, setColor: (c) => bg.uniforms.uColor.value.set(c) };
}
