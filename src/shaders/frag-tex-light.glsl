precision mediump float;

uniform sampler2D uTexture;
uniform vec3 uLightPos;
uniform vec3 uLightColor;
uniform float uNumSpiders;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
  // Texture lookup. Binary transparency, no blending.
  vec4 texColor = texture2D(uTexture, vUV);
  if (texColor.w < 0.5) discard;

  // Lighting
  vec3 lightVec = uLightPos - vPosition;
  // Light intensity falls off with square of distance
  float multDist = 1.0 / (1.0 + dot(lightVec, lightVec) * 0.0025 * uNumSpiders);
  // Light mostly only hits surfaces that are facing the light
  float lightDot = dot(normalize(lightVec), vNormal);
  float multDot = sqrt(0.25 + lightDot * lightDot);
  vec3 totalLight = uLightColor * multDist * multDot;

  gl_FragColor = vec4(texColor.xyz * totalLight, 1.0);
}
