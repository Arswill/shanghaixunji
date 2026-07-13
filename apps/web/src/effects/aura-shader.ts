// Aura Particle Shader: GPU particles with breathing drift + additive glow
// Vertex: spherical shell breathing, float drift, perspective point size
// Fragment: circular gradient falloff, element color, additive blending

export const auraVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aOffset;
  uniform float uTime;
  uniform float uRadius;
  uniform float uSpeed;
  varying float vAlpha;

  void main() {
    vec3 pos = position;

    // Spherical shell breathing — particles drift outward/inward
    float breath = sin(uTime * uSpeed + aOffset) * 0.5 + 0.5;
    pos *= uRadius * (0.85 + breath * 0.3);

    // Floating drift on each axis
    pos.x += sin(uTime * 0.5 + aOffset * 2.0) * 0.12;
    pos.y += cos(uTime * 0.4 + aOffset * 1.5) * 0.12;
    pos.z += sin(uTime * 0.6 + aOffset * 3.0) * 0.12;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Point size with perspective attenuation
    float pointSize = aSize * (300.0 / max(-mvPosition.z, 0.1));
    gl_PointSize = pointSize * (0.5 + breath * 0.5);

    vAlpha = 0.3 + breath * 0.7;
  }
`;

export const auraFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  void main() {
    // Circular gradient: distance from center of point sprite
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;

    // Soft radial falloff
    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
    gl_FragColor = vec4(uColor, alpha);
  }
`;
