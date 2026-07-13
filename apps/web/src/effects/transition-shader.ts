// Particle Dissolve Transition Shader
// Three-phase transition: converge → hold → dissolve
// Phase 1 (converge): particles rush IN from dispersed positions to grid
// Phase 2 (hold): particles at grid positions, fully opaque, screen covered
// Phase 3 (dissolve): particles disperse outward with noise turbulence, fading

export const transitionVertexShader = /* glsl */ `
  attribute vec3 aDispersion;
  attribute float aSize;
  attribute float aDelay;
  attribute vec3 aColor;

  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    // Per-particle delay — center particles move first, edges follow
    float delayedProgress = clamp((uProgress - aDelay) / (1.0 - aDelay + 0.001), 0.0, 1.0);

    // Phase boundaries (in normalized progress space)
    float converge = smoothstep(0.0, 0.3, delayedProgress);
    float dissolve = smoothstep(0.4, 1.0, delayedProgress);

    // Position: dispersed → grid (converge), then grid → dispersed (dissolve)
    vec3 gridPos = position;
    vec3 dispersedPos = position + aDispersion;
    vec3 pos = mix(mix(dispersedPos, gridPos, converge), dispersedPos, dissolve);

    // Turbulence during motion phases only
    float motionIntensity = (1.0 - converge) * (1.0 - dissolve) + dissolve * converge;
    float n1 = hash(position.xy * 3.0 + uTime * 0.3);
    float n2 = hash(position.xy * 3.0 + uTime * 0.3 + 50.0);
    pos.x += (n1 - 0.5) * motionIntensity * 0.4;
    pos.y += (n2 - 0.5) * motionIntensity * 0.4;

    // Alpha: ramp up during converge, hold at 1, ramp down during dissolve
    vAlpha = converge * (1.0 - dissolve);

    // Point size: grows during converge, shrinks during dissolve
    float sizeMul = 0.3 + converge * 0.7 * (1.0 - dissolve * 0.5);
    gl_PointSize = aSize * uPixelRatio * sizeMul;

    vColor = aColor;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const transitionFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    // Soft circular falloff with inner glow boost
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    vec3 color = vColor * (1.0 + (1.0 - dist) * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;
