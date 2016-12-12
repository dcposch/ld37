precision mediump float;

uniform sampler2D uTexture;

varying vec2 vUV;

void main(void) {
  vec4 texColor = texture2D(uTexture, vUV);
  if (texColor.w < 0.5) discard;
  gl_FragColor = texColor;
}
