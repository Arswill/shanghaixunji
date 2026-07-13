// src/effects/scene-shaders.ts
// 背景场景 GLSL shader 代码

// ─── 远山 SDF shader ───
export const mountainVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const mountainFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uFogDensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float mountainShape(vec2 uv, float seed) {
    float h = 0.0;
    h += noise(vec2(uv.x * 3.0 + seed, 0.0)) * 0.4;
    h += noise(vec2(uv.x * 7.0 + seed, 0.0)) * 0.2;
    h += noise(vec2(uv.x * 15.0 + seed, 0.0)) * 0.1;
    return h;
  }

  void main() {
    vec2 uv = vUv;
    float mountain = mountainShape(uv, uTime * 0.01);
    float mask = smoothstep(mountain, mountain + 0.05, 1.0 - uv.y);
    vec3 col = uColor * (0.6 + mountain * 0.4);
    float fog = smoothstep(0.0, 0.5, uv.y) * uFogDensity;
    col = mix(col, vec3(0.0), fog);
    gl_FragColor = vec4(col, 1.0 - mask * 0.7);
  }
`

// ─── 水面波纹 shader ───
export const waterVertexShader = `
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave = sin(pos.x * 2.0 + uTime * 1.5) * 0.05
               + sin(pos.z * 3.0 + uTime * 1.2) * 0.03;
    pos.y += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

export const waterFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;
  varying float vWave;

  void main() {
    vec3 col = uColor + vec3(vWave * 0.5);
    float caustic = sin(vUv.x * 20.0 + uTime * 2.0) * sin(vUv.y * 20.0 + uTime * 1.5);
    col += vec3(caustic * 0.1);
    gl_FragColor = vec4(col, 0.8);
  }
`

// ─── 云层 shader ───
export const cloudVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const cloudFragmentShader = `
  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform float uDensity;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv + vec2(uTime * 0.02, uTime * 0.01);
    float n = fbm(uv * 3.0);
    float mask = smoothstep(0.3, 0.6, n) * uDensity;
    vec3 col = mix(uColor1, uColor2, n);
    gl_FragColor = vec4(col, mask);
  }
`

// ─── 树林 alpha cutout shader ───
export const forestVertexShader = mountainVertexShader

export const forestFragmentShader = `
  uniform vec3 uColor;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;
    float trunk = step(0.48, uv.x) * step(uv.x, 0.52) * step(uv.y, 0.4);
    float crown = step(0.3, uv.x) * step(uv.x, 0.7) * step(0.3, uv.y);
    float n = noise(uv * 8.0 + uTime * 0.05);
    crown *= step(0.3, n);
    float mask = max(trunk, crown);
    if (mask < 0.01) discard;
    gl_FragColor = vec4(uColor * (0.7 + n * 0.3), mask);
  }
`
