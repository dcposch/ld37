precision mediump float;

attribute vec2 aVertexPosition;
attribute vec4 aVertexColor;

varying vec4 vColor;

// aVertexPosition in clip coordinates.
void main(void) {
  gl_Position = vec4(aVertexPosition, 0.0, 1.0);
  vColor = aVertexColor;
}
