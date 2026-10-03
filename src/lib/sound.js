/**
 * Key sounds, synthesized with the Web Audio API: nothing to download.
 * A correct key gives a short high click; a mistake gives a low thud.
 *
 * The audio context is created on the first sound, which always follows a keystroke:
 * browsers only allow audio after the user has interacted with the page.
 */
let context = null

function audio() {
  context ??= new AudioContext()
  if (context.state === 'suspended') context.resume()
  return context
}

/**
 * @param {'click' | 'error'} kind
 */
export function playKeySound(kind) {
  try {
    const ac = audio()
    const now = ac.currentTime
    const oscillator = ac.createOscillator()
    const volume = ac.createGain()
    const isError = kind === 'error'

    oscillator.type = isError ? 'triangle' : 'square'
    // A little pitch variation keeps a fast run of clicks from sounding robotic.
    oscillator.frequency.setValueAtTime(isError ? 140 : 1700 + Math.random() * 300, now)
    const length = isError ? 0.09 : 0.025
    volume.gain.setValueAtTime(isError ? 0.12 : 0.035, now)
    volume.gain.exponentialRampToValueAtTime(0.0001, now + length) // a fast fade, not a hard stop

    oscillator.connect(volume).connect(ac.destination)
    oscillator.start(now)
    oscillator.stop(now + length)
  } catch {
    // No audio available (old browser, blocked): typing just stays silent.
  }
}
