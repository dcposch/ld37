module.exports = {
  CONTROLS: {
    KEY: {
      'ArrowUp': 'forward',
      'ArrowLeft': 'left',
      'ArrowDown': 'back',
      'ArrowRight': 'right',
      'w': 'forward',
      'a': 'left',
      's': 'back',
      'd': 'right',
      'W': 'forward',
      'A': 'left',
      'S': 'back',
      'D': 'right',
      ' ': 'jump'
    },
    MOUSE: {
      1: 'attack'
    },
    MOUSE_SENSITIVITY: 0.005 // radians per pixel
  },
  PHYSICS: {
    PLAYER_WIDTH: 0.2, // meters
    PLAYER_HEIGHT: 1.8,
    SPEED_WALK: 2.5, // meters per second
    SPEED_JUMP: 5,
    GRAVITY: 9.8 // ms^-2
  },
  WORLD: {
    ROOM_WIDTH: 8,
    ROOM_HEIGHT: 3
  },
  SERVER: {
    PORT: 8080
  }
}
