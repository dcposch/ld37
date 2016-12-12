precision mediump float;

attribute vec2 aPosition;
attribute vec4 aColor;

varying vec4 vColor;

// aPosition in clip coordinates.
void main(void) {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vColor = aColor;
}
