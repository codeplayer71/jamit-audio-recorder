# @codeplayer71/audio-recorder-core

Framework-independent and fully typed browser audio recording core based on the MediaRecorder API.

## Installation

```bash
pnpm add @codeplayer71/audio-recorder-core
```

```bash
npm install @codeplayer71/audio-recorder-core
```

```bash
yarn add @codeplayer71/audio-recorder-core
```

## Usage

```ts
import { createAudioRecorder } from '@codeplayer71/audio-recorder-core';

const recorder = createAudioRecorder({
  maxDurationMs: 120_000,
  maxFileSizeBytes: 10_000_000,
});

const unsubscribe = recorder.subscribe((snapshot) => {
  console.log(snapshot.state);
  console.log(snapshot.durationMs);
  console.log(snapshot.recording);
  console.log(snapshot.error);
});

await recorder.start();

const recording = await recorder.stop();

console.log(recording.file);
console.log(recording.url);

unsubscribe();
recorder.destroy();
```

## Documentation

Full documentation, framework integrations and examples are available in the main repository:

https://github.com/codeplayer71/jamit-audio-recorder

## License

MIT