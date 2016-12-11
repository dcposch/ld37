function requestFullscreen (el) {
  var request = (
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen
  )
  request.call(el)
}
exports.requestFullscreen = requestFullscreen

Object.defineProperty(exports, 'fullscreenElement', {
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
