let audioContext: AudioContext | null = null

export function prepareAlerts() {
  if (audioContext === null) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume()
  }
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}

export function playChime() {
  if (audioContext === null) {
    return
  }

  const context = audioContext
  const notes = [660, 880, 1100, 660, 880, 1100, 660, 880, 1100]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const noteStart = context.currentTime + index * 0.5

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency

    gain.gain.setValueAtTime(0.0001, noteStart)
    gain.gain.exponentialRampToValueAtTime(0.3, noteStart + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.45)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(noteStart)
    oscillator.stop(noteStart + 0.5)
  })
}

export function showNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body: body })
  }
}