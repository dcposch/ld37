var EventEmitter = require('events')

var fullscreen = new EventEmitter()

function requestFullscreen (el) {
  var request = (
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  )
  request.call(el)
}
fullscreen.requestFullscreen = requestFullscreen

Object.defineProperty(fullscreen, 'fullscreenElement', {
  get: function () {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    )
  }
})

document.addEventListener('fullscreenchange', onFullscreenChange)
document.addEventListener('webkitfullscreenchange', onFullscreenChange)
document.addEventListener('mozfullscreenchange', onFullscreenChange)
document.addEventListener('onmsfullscreenchange', onFullscreenChange)

function onFullscreenChange () {
  fullscreen.emit(fullscreen.fullscreenElement ? 'attain' : 'release')
}

module.exports = exports = fullscreen
