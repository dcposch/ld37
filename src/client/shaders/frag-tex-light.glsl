precision mediump float;

uniform sampler2D uTexture;
uniform vec3 uLightPos;
uniform vec3 uLightColor;

varying vec2 vUV;
varying vec3 vPosition;
varying vec3 vNormal;

void main(void) {
  vec4 texColor = texture2D(uTexture, vUV);
  if (texColor.w < 0.5) discard;

  float intensity = 1.0 / (1.0 + dot(uLightPos - vPosition, uLightPos - vPosition) * 0.1);

  gl_FragColor = vec4(texColor.xyz * uLightColor * intensity, 1.0);
}
