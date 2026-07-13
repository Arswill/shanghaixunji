// 2.5D Parallax Shader: depth-map driven UV displacement + edge glow + breathing
export const parallaxVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const parallaxFragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform vec2 uMouse;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uGlowColor;
  varying vec2 vUv;

  void main() {
    float depth = texture2D(uDepthMap, vUv).r;
    float breath = sin(uTime * 0.6) * 0.5 + 0.5;
    vec2 offset = uMouse * depth * uIntensity * (1.0 + breath * 0.15);
    vec2 uv = clamp(vUv + offset, 0.0, 1.0);
    vec4 color = texture2D(uTexture, uv);

    // Edge glow via depth derivatives
    float dx = dFdx(depth);
    float dy = dFdy(depth);
    float edge = clamp(length(vec2(dx, dy)) * 8.0, 0.0, 1.0);
    vec3 glow = uGlowColor * edge * (0.6 + breath * 0.4);

    // Depth boost: closer = brighter
    gl_FragColor = vec4(color.rgb + glow + depth * 0.15, color.a);
  }
`;