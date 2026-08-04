<script setup lang="ts">
import { useAudioRecorder } from '@jamit/audio-recorder-vue';
import { computed } from 'vue';

const {
  snapshot,
  start,
  pause,
  resume,
  stop,
  cancel,
  reset,
} = useAudioRecorder({
  maxDurationMs: 120_000,
  maxFileSizeBytes: 10_000_000,
  audioConstraints: {
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
});

const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(snapshot.value.durationMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

async function startRecording(): Promise<void> {
  await start();
}

function pauseRecording(): void {
  pause();
}

function resumeRecording(): void {
  resume();
}

async function stopRecording(): Promise<void> {
  await stop();
}

function cancelRecording(): void {
  cancel();
}

function resetRecording(): void {
  reset();
}

</script>

<template>
  <main class="recorder">
    <h1>JamIT Audio Recorder</h1>

    <p class="recorder__status">
      Status:
      <strong>{{ snapshot.state }}</strong>
    </p>

    <p>Duration: {{ formattedDuration }}</p>

    <div class="recorder__actions">
      <button
          type="button"
          :disabled="snapshot.state !== 'idle'"
          @click="startRecording"
      >
        Start
      </button>

      <button
          type="button"
          :disabled="snapshot.state !== 'recording'"
          @click="pauseRecording"
      >
        Pause
      </button>

      <button
          type="button"
          :disabled="snapshot.state !== 'paused'"
          @click="resumeRecording"
      >
        Resume
      </button>

      <button
          type="button"
          :disabled="!['recording', 'paused'].includes(snapshot.state)"
          @click="stopRecording"
      >
        Stop
      </button>

      <button
          type="button"
          :disabled="!['recording', 'paused'].includes(snapshot.state)"
          @click="cancelRecording"
      >
        Cancel
      </button>

      <button
          type="button"
          :disabled="snapshot.recording === null && snapshot.error === null"
          @click="resetRecording"
      >
        Reset
      </button>
    </div>

    <p
        v-if="snapshot.error"
        class="recorder__error"
    >
      {{ snapshot.error.message }}
    </p>

    <audio
        v-if="snapshot.recording"
        :src="snapshot.recording.url"
        controls
    />

    <a
        class="recorder__download"
        :class="{
        'recorder__download--disabled': snapshot.recording === null,
      }"
        :href="snapshot.recording?.url"
        :download="snapshot.recording?.file.name"
        :aria-disabled="snapshot.recording === null"
        :tabindex="snapshot.recording ? 0 : -1"
    >
      Download recording
    </a>
    <footer class="recorder__footer">
      Created by
      <a
          href="https://jamit.one"
          target="_blank"
          rel="noopener noreferrer"
      >
        JamIT
      </a>
    </footer>
  </main>
</template>