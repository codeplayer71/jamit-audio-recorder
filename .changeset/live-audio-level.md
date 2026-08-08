---
"@codeplayer71/audio-recorder-core": minor
"@codeplayer71/audio-recorder-vue": minor
"@codeplayer71/audio-recorder-react": minor
"@codeplayer71/audio-recorder-nuxt": minor
---

Add live normalized audio level monitoring across the JamIT Audio Recorder packages.

The core now exposes `audioLevel` as a normalized value between `0` and `1`, calculated from the active microphone stream using Web Audio API analysis with smoothing and automatic lifecycle cleanup.

Vue and React expose the live audio level through their composable and hook and include an accessible built-in level meter with customization options.

Nuxt automatically exposes the same functionality through the Vue integration.