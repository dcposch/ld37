var SFX = [
  'bite',
  'footsteps',
  'spider-walk',
  'spawn1',
  'spawn2',
  'spawn3',
  'start'
]

var BACKGROUND_MUSIC = [
  'the-escalation', // level 1
  'iron-horse',     // level 2
  'bangarang'       // level 3
]

// Custom volumes for certain sounds, all others will be 1
var VOLUME = {
  'start': 0.7,
  'footsteps': 0.2,
  'iron-horse': 0.6,
  'bangarang': 0.6
}

// Cache <audio> elements for instant playback
var cache = {}
var currentBackground = null
var wasWalking = false

// Preload short sound files
function preload () {
  SFX.forEach(function (name) {
    var audio = new window.Audio()
    audio.src = 'sound/' + name + '.mp3'
    audio.preload = true
    cache[name] = audio
  })
}
exports.preload = preload

function tick (state) {
  var isWalking = (
    state.actions['forward'] || state.actions['back'] ||
    state.actions['left'] || state.actions['right']
  )

  if (isWalking && !wasWalking) {
    startPlay('footsteps')
  }
  if (wasWalking && !isWalking) {
    stopPlay('footsteps')
  }

  wasWalking = isWalking
}
exports.tick = tick

// Takes a name (for short sounds) or a URL (for larger files, not in git)
// Optionally takes a time offset in seconds
function play (name, opts) {
  if (!opts) opts = {}

  var audio = cache[name]
  if (!audio) {
    audio = new window.Audio()
    audio.src = 'sound/' + name + '.mp3'
    cache[name] = audio
  }
  audio.volume = VOLUME[name] || 1
  audio.currentTime = 0
  audio.play()

  addEvents(audio, opts)

  return audio
}
exports.play = play

// Start playing music for given level (should be: 1, 2, 3)
function startBackground (num) {
  var name = BACKGROUND_MUSIC[num - 1]
  var volume = VOLUME[name] || 1

  var audio = play(name)
  audio.loop = true

  if (currentBackground) {
    crossfade(currentBackground, audio, volume)
  } else {
    fadeIn(audio, volume)
  }
  currentBackground = audio
}
exports.startBackground = startBackground

function startPlay (name) {
  var audio = play(name)
  audio.loop = true
}
exports.startPlay = startPlay

function stopPlay (name) {
  var audio = cache[name]
  if (!audio) return
  audio.pause()
}
exports.stopPlay = stopPlay

/**
 * Slowly increase the volume of an audio tag.
 */
function fadeIn (audio, volume, ms) {
  volume = volume || 1
  ms = ms || 2500
  var increment = audio.volume / (ms / 50)
  var interval

  audio.volume = 0

  addEvents(audio, {
    // Wait until audio starts to play before increasing volume
    playing: function () { interval = setInterval(onInterval, 50) }
  })

  function onInterval () {
    audio.volume = Math.min(audio.volume + increment, volume)
    if (audio.volume === volume) clearInterval(interval)
  }
}

/**
 * Slowly decrease the volume of an audio tag.
 */
function fadeOut (audio, ms) {
  ms = ms || 2500
  var increment = audio.volume / (ms / 50)
  var interval = setInterval(onInterval, 50)
  function onInterval () {
    audio.volume = Math.max(audio.volume - increment, 0)
    if (audio.volume === 0) {
      audio.pause()
      clearInterval(interval)
    }
  }
}

/**
 * Cross-fade between two audio tags. `oldAudio` should already be playing, while
 * `newAudio` should not yet have started
 */
function crossfade (oldAudio, newAudio, newVolume) {
  fadeIn(newAudio, newVolume)
  addEvents(newAudio, {
    // Wait until new audio begins to play before fading out the old audio, so
    // they line up perfectly
    playing: function () { fadeOut(oldAudio) }
  })
}

/**
 * Helper to add events to an audio tag
 * @param {[type]} audio [description]
 * @param {[type]} opts  [description]
 */
function addEvents (audio, opts) {
  for (var eventName in opts) {
    var onEvent = function () {
      audio.removeEventListener(eventName, onEvent)
      opts[eventName]()
    }
    audio.addEventListener(eventName, onEvent)
  }
}

// for easier debugging
window.sound = exports
