var Howl = require('howler').Howl

var SFX = [
  'bite',
  'footsteps',
  'spider-walk',
  'spawn1',
  'spider-death',
  'spider-death2',
  'start',
  'flamethrower'
]

var OGG = [
]

var SPRITE = {
  'flamethrower': [100, 1000, true]
}

var LEVEL_MUSIC = [
  'the-escalation', // level 1
  'iron-horse',     // level 2
  'bangarang'       // level 3
]

// Custom volumes for certain sounds, all others will be 1
var VOLUME = {
  'start': 0.7,
  'footsteps': 0.2,
  'iron-horse': 0.6,
  'bangarang': 0.6,
  'spider-walk': 0.2,
  'flamethrower': 0.1,
  'spider-death': 0.15,
  'spider-death2': 0.15
}

// Cache <audio> elements for instant playback
var cache = {}
var currentLevel = 0
var isPlaying = {}

// Preload short sound files
function preload () {
  SFX.forEach(function (name) {
    cache[name] = new Howl({
      src: 'sound/' + name + (OGG.includes(name) ? '.ogg' : '.mp3'),
      volume: VOLUME[name] || 1,
      sprite: SPRITE[name] && { main: SPRITE[name] }
    })
  })
}
exports.preload = preload

function tick (state) {
  // Set level music
  var desiredLevel = state.player.score < 20 ? 1 : state.player.score < 60 ? 2 : 3
  if (currentLevel !== desiredLevel) startLevel(desiredLevel)

  // Walking sound
  var isWalking = (
    state.actions['forward'] || state.actions['back'] ||
    state.actions['left'] || state.actions['right']
  )
  if (isWalking && !isPlaying.footsteps) {
    startPlay('footsteps')
  }
  if (!isWalking && isPlaying.footsteps) {
    stopPlay('footsteps')
  }

  // Spider sounds
  if (state.spiders.length > 0 && !isPlaying['spider-walk']) {
    startPlay('spider-walk')
  }
  if (state.spiders.length === 0 && isPlaying['spider-walk']) {
    stopPlay('spider-walk')
  }

  // Flamethrower sound
  if (state.actions.attack && !isPlaying['flamethrower']) {
    startPlay('flamethrower')
  }
  if (!state.actions.attack && isPlaying['flamethrower']) {
    stopPlay('flamethrower')
  }
}
exports.tick = tick

// Takes a name (for short sounds) or a URL (for larger files, not in git)
// Optionally takes a time offset in seconds
function play (name) {
  var audio = cache[name]
  if (!audio) {
    audio = cache[name] = new Howl({
      src: 'sound/' + name + (OGG[name] ? '.ogg' : '.mp3'),
      html5: true,
      volume: VOLUME[name] || 1
    })
  }
  audio.volume(VOLUME[name] || 1)
  audio.seek(0)
  audio.play(SPRITE[name] ? 'main' : undefined)

  return audio
}
exports.play = play

// Start playing music for given level (should be: 1, 2, 3)
function startLevel (level) {
  var num = level - 1
  var name = LEVEL_MUSIC[num]
  var volume = VOLUME[name] || 1

  var audio = play(name)
  audio.loop(true)

  if (currentLevel) {
    crossfade(cache[LEVEL_MUSIC[currentLevel - 1]], audio, volume)
  } else {
    fadeIn(audio, volume)
  }
  currentLevel = level
}
exports.startLevel = startLevel

function startPlay (name) {
  var audio = play(name)
  audio.loop(true)
  isPlaying[name] = true
}
exports.startPlay = startPlay

function stopPlay (name) {
  if (!isPlaying[name]) return
  var audio = cache[name]
  audio.pause()
  delete isPlaying[name]
}
exports.stopPlay = stopPlay

/**
 * Slowly increase the volume of an audio tag.
 */
function fadeIn (audio, volume) {
  volume = volume || 1
  audio.once('play', function () {
    audio.fade(0, volume)
  })
}

/**
 * Slowly decrease the volume of an audio tag.
 */
function fadeOut (audio) {
  audio.fade(audio.volume(), 0, 2500)
  audio.once('fade', function () {
    audio.pause()
  })
}

/**
 * Cross-fade between two audio tags. `oldAudio` should already be playing, while
 * `newAudio` should not yet have started
 */
function crossfade (oldAudio, newAudio, newVolume) {
  fadeIn(newAudio, newVolume)

  // Wait until new audio begins to play before fading out the old audio, so
  // they line up perfectly
  newAudio.once('play', function () {
    fadeOut(oldAudio)
  })
}

// for easier debugging
window.sound = exports
