<script setup lang="ts">
import { computed } from 'vue';
import type { UseAudioRecorderOptions } from '../use-audio-recorder';
import { useAudioRecorder } from '../use-audio-recorder';

type AudioConstraints =
    NonNullable<UseAudioRecorderOptions>['audioConstraints'];

export type JamItAudioRecorderProps = {
  title?: string;
  startLabel?: string;
  pauseLabel?: string;
  resumeLabel?: string;
  stopLabel?: string;
  cancelLabel?: string;
  resetLabel?: string;
  downloadLabel?: string;
  statusLabel?: string;
  durationLabel?: string;
  maxDurationMs?: number;
  maxFileSizeBytes?: number;
  audioConstraints?: AudioConstraints;
  showTitle?: boolean;
  showStatus?: boolean;
  showDuration?: boolean;
  showAudioLevel?: boolean;
  showPlayer?: boolean;
  showDownload?: boolean;
  showCancel?: boolean;
  showReset?: boolean;
};

const props = withDefaults(
    defineProps<JamItAudioRecorderProps>(),
    {
      title: 'Audio Recorder',
      startLabel: 'Start recording',
      pauseLabel: 'Pause',
      resumeLabel: 'Resume',
      stopLabel: 'Stop',
      cancelLabel: 'Cancel',
      resetLabel: 'Reset',
      downloadLabel: 'Download recording',
      statusLabel: 'Status',
      durationLabel: 'Duration',
      maxDurationMs: 120_000,
      maxFileSizeBytes: 10_000_000,
      audioConstraints: () => ({
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }),
      showTitle: true,
      showStatus: true,
      showDuration: true,
      showAudioLevel: true,
      showPlayer: true,
      showDownload: true,
      showCancel: true,
      showReset: true,
    },
);

const {
  snapshot,
  audioLevel,
  start,
  pause,
  resume,
  stop,
  cancel,
  reset,
} = useAudioRecorder({
  maxDurationMs: props.maxDurationMs,
  maxFileSizeBytes: props.maxFileSizeBytes,
  audioConstraints: props.audioConstraints,
});

const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(snapshot.value.durationMs / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const isIdle = computed(() => snapshot.value.state === 'idle');
const isRecording = computed(() => snapshot.value.state === 'recording');
const isPaused = computed(() => snapshot.value.state === 'paused');
const isActive = computed(() => isRecording.value || isPaused.value);
const isAudioLevelVisible = computed(
    () => props.showAudioLevel && isActive.value,
);

const canReset = computed(
    () =>
        snapshot.value.recording !== null ||
        snapshot.value.error !== null,
);

const canDownload = computed(
    () => snapshot.value.recording !== null,
);
</script>

<template>
  <section class="jamit-audio-recorder">
    <slot
        name="header"
        :snapshot="snapshot"
    >
      <header
          v-if="props.showTitle"
          class="jamit-audio-recorder__header"
      >
        <h2 class="jamit-audio-recorder__title">
          {{ props.title }}
        </h2>
      </header>
    </slot>

    <div class="jamit-audio-recorder__meta">
      <slot
          name="status"
          :state="snapshot.state"
          :snapshot="snapshot"
      >
        <p
            v-if="props.showStatus"
            class="jamit-audio-recorder__status"
        >
          <span class="jamit-audio-recorder__label">
            {{ props.statusLabel }}
          </span>

          <strong class="jamit-audio-recorder__state">
            {{ snapshot.state }}
          </strong>
        </p>
      </slot>

      <slot
          name="duration"
          :duration-ms="snapshot.durationMs"
          :formatted-duration="formattedDuration"
          :snapshot="snapshot"
      >
        <p
            v-if="props.showDuration"
            class="jamit-audio-recorder__duration"
        >
          <span class="jamit-audio-recorder__label">
            {{ props.durationLabel }}
          </span>

          <strong>{{ formattedDuration }}</strong>
        </p>
      </slot>
    </div>

    <slot
        name="audioLevel"
        :audio-level="audioLevel"
        :snapshot="snapshot"
        :is-recording="isRecording"
        :is-paused="isPaused"
    >
      <div
          v-if="isAudioLevelVisible"
          class="jamit-audio-recorder__audio-level"
          role="meter"
          aria-label="Audio input level"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="Math.round(audioLevel * 100)"
      >
        <div
            class="jamit-audio-recorder__audio-level-value"
            :style="{
          transform: `scaleX(${audioLevel})`,
        }"
        />
      </div>
    </slot>

    <slot
        name="controls"
        :snapshot="snapshot"
        :is-idle="isIdle"
        :is-recording="isRecording"
        :is-paused="isPaused"
        :is-active="isActive"
        :start="start"
        :pause="pause"
        :resume="resume"
        :stop="stop"
        :cancel="cancel"
        :reset="reset"
    >
      <div class="jamit-audio-recorder__controls">
        <button
            type="button"
            class="
            jamit-audio-recorder__button
            jamit-audio-recorder__button--primary
          "
            :disabled="!isIdle"
            @click="start"
        >
          <svg
              class="jamit-audio-recorder__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <circle
                cx="12"
                cy="12"
                r="6"
                fill="currentColor"
            />
          </svg>

          <span>{{ props.startLabel }}</span>
        </button>

        <button
            type="button"
            class="jamit-audio-recorder__button"
            :disabled="!isRecording"
            @click="pause"
        >
          <svg
              class="jamit-audio-recorder__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <path
                d="M7 5h4v14H7zM13 5h4v14h-4z"
                fill="currentColor"
            />
          </svg>

          <span>{{ props.pauseLabel }}</span>
        </button>

        <button
            type="button"
            class="jamit-audio-recorder__button"
            :disabled="!isPaused"
            @click="resume"
        >
          <svg
              class="jamit-audio-recorder__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <path
                d="M8 5v14l11-7z"
                fill="currentColor"
            />
          </svg>

          <span>{{ props.resumeLabel }}</span>
        </button>

        <button
            type="button"
            class="jamit-audio-recorder__button"
            :disabled="!isActive"
            @click="stop"
        >
          <svg
              class="jamit-audio-recorder__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <rect
                x="6"
                y="6"
                width="12"
                height="12"
                rx="1"
                fill="currentColor"
            />
          </svg>

          <span>{{ props.stopLabel }}</span>
        </button>

        <button
            v-if="props.showCancel"
            type="button"
            class="
            jamit-audio-recorder__button
            jamit-audio-recorder__button--danger
          "
            :disabled="!isActive"
            @click="cancel"
        >
          <svg
              class="jamit-audio-recorder__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <path
                d="M7 7l10 10M17 7L7 17"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-width="2.5"
            />
          </svg>

          <span>{{ props.cancelLabel }}</span>
        </button>

        <button
            v-if="props.showReset"
            type="button"
            class="
            jamit-audio-recorder__button
            jamit-audio-recorder__button--reset
          "
            :disabled="!canReset"
            @click="reset"
        >
          <svg
              class="jamit-audio-recorder__icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
          >
            <path
                d="M5 8V4m0 0h4M5 4l3 3a7 7 0 1 1-1.45 7.62"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
            />
          </svg>

          <span>{{ props.resetLabel }}</span>
        </button>
      </div>
    </slot>

    <slot
        name="error"
        :error="snapshot.error"
        :snapshot="snapshot"
    >
      <p
          v-if="snapshot.error"
          class="jamit-audio-recorder__error"
          role="alert"
      >
        {{ snapshot.error.message }}
      </p>
    </slot>

    <slot
        name="player"
        :recording="snapshot.recording"
        :snapshot="snapshot"
    >
      <audio
          v-if="props.showPlayer && snapshot.recording"
          class="jamit-audio-recorder__player"
          :src="snapshot.recording.url"
          controls
      />
    </slot>

    <slot
        name="download"
        :recording="snapshot.recording"
        :can-download="canDownload"
        :snapshot="snapshot"
    >
      <a
          v-if="props.showDownload"
          class="jamit-audio-recorder__download"
          :class="{
          'jamit-audio-recorder__download--disabled': !canDownload,
        }"
          :href="snapshot.recording?.url"
          :download="snapshot.recording?.file.name"
          :aria-disabled="!canDownload"
          :tabindex="canDownload ? 0 : -1"
      >
        <svg
            class="jamit-audio-recorder__icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
          <path
              d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
          />
        </svg>

        <span>{{ props.downloadLabel }}</span>
      </a>
    </slot>

    <slot
        name="footer"
        :snapshot="snapshot"
    />
  </section>
</template>

<style>
.jamit-audio-recorder {
  --jamit-recorder-background: #ffffff;
  --jamit-recorder-color: #111827;
  --jamit-recorder-muted-color: #6b7280;
  --jamit-recorder-border-color: #e5e7eb;
  --jamit-recorder-primary: #111827;
  --jamit-recorder-primary-hover: #374151;
  --jamit-recorder-danger: #b91c1c;
  --jamit-recorder-danger-hover: #991b1b;
  --jamit-recorder-disabled-background: #e5e7eb;
  --jamit-recorder-disabled-color: #9ca3af;
  --jamit-recorder-error-background: #fee2e2;
  --jamit-recorder-error-color: #991b1b;
  --jamit-recorder-border-radius: 16px;
  --jamit-recorder-button-radius: 8px;
  --jamit-recorder-spacing: 24px;
  --jamit-recorder-icon-size: 18px;
  --jamit-recorder-audio-level-background:
      var(--jamit-recorder-border-color);
  --jamit-recorder-audio-level-color:
      var(--jamit-recorder-primary);
  --jamit-recorder-audio-level-height: 0.5rem;

  container-type: inline-size;
  width: min(100%, 720px);
  padding: var(--jamit-recorder-spacing);
  border: 1px solid var(--jamit-recorder-border-color);
  border-radius: var(--jamit-recorder-border-radius);
  color: var(--jamit-recorder-color);
  background: var(--jamit-recorder-background);
  box-shadow: 0 16px 40px rgb(15 23 42 / 10%);
}

.jamit-audio-recorder__header {
  margin-bottom: 24px;
}

.jamit-audio-recorder__title {
  margin: 0;
  font-size: clamp(1.5rem, 4vw, 2rem);
  line-height: 1.2;
}

.jamit-audio-recorder__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}

.jamit-audio-recorder__audio-level {
  width: 100%;
  height: var(--jamit-recorder-audio-level-height);
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: var(
      --jamit-recorder-audio-level-background,
      var(--jamit-recorder-border-color)
  );
}

.jamit-audio-recorder__audio-level-value {
  width: 100%;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left;
  background: var(
      --jamit-recorder-audio-level-color,
      var(--jamit-recorder-primary)
  );
  transition: transform 80ms linear;
}

@media (prefers-reduced-motion: reduce) {
  .jamit-audio-recorder__audio-level-value {
    transition: none;
  }
}

.jamit-audio-recorder__status,
.jamit-audio-recorder__duration {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.jamit-audio-recorder__label {
  color: var(--jamit-recorder-muted-color);
}

.jamit-audio-recorder__state {
  text-transform: capitalize;
}

.jamit-audio-recorder__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 24px;
}

.jamit-audio-recorder__button,
.jamit-audio-recorder__download {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.jamit-audio-recorder__button {
  min-height: 44px;
  padding: 0 18px;
  border: 1px solid var(--jamit-recorder-border-color);
  border-radius: var(--jamit-recorder-button-radius);
  color: var(--jamit-recorder-color);
  background: var(--jamit-recorder-background);
  font: inherit;
  cursor: pointer;
  transition:
      background-color 150ms ease,
      border-color 150ms ease,
      color 150ms ease,
      transform 150ms ease;
}

.jamit-audio-recorder__icon {
  width: var(--jamit-recorder-icon-size);
  height: var(--jamit-recorder-icon-size);
  flex: 0 0 auto;
}

.jamit-audio-recorder__button:hover:not(:disabled) {
  background: #f9fafb;
}

.jamit-audio-recorder__button:active:not(:disabled) {
  transform: translateY(1px);
}

.jamit-audio-recorder__button:focus-visible,
.jamit-audio-recorder__download:focus-visible {
  outline: 3px solid rgb(59 130 246 / 35%);
  outline-offset: 2px;
}

.jamit-audio-recorder__button--primary {
  border-color: var(--jamit-recorder-primary);
  color: #ffffff;
  background: var(--jamit-recorder-primary);
}

.jamit-audio-recorder__button--primary:hover:not(:disabled) {
  border-color: var(--jamit-recorder-primary-hover);
  background: var(--jamit-recorder-primary-hover);
}

.jamit-audio-recorder__button--danger {
  border-color: var(--jamit-recorder-danger);
  color: #ffffff;
  background: var(--jamit-recorder-danger);
}

.jamit-audio-recorder__button--danger:hover:not(:disabled) {
  border-color: var(--jamit-recorder-danger-hover);
  background: var(--jamit-recorder-danger-hover);
}

.jamit-audio-recorder__button:disabled {
  border-color: var(--jamit-recorder-disabled-background);
  color: var(--jamit-recorder-disabled-color);
  background: var(--jamit-recorder-disabled-background);
  cursor: not-allowed;
}

.jamit-audio-recorder__error {
  margin: 24px 0 0;
  padding: 12px 16px;
  border-radius: var(--jamit-recorder-button-radius);
  color: var(--jamit-recorder-error-color);
  background: var(--jamit-recorder-error-background);
}

.jamit-audio-recorder__player {
  width: 100%;
  margin-top: 24px;
}

.jamit-audio-recorder__download {
  min-height: 44px;
  margin-top: 16px;
  padding: 0 18px;
  border-radius: var(--jamit-recorder-button-radius);
  color: #ffffff;
  background: var(--jamit-recorder-primary);
  text-decoration: none;
  transition:
      background-color 150ms ease,
      color 150ms ease;
}

.jamit-audio-recorder__download:hover {
  background: var(--jamit-recorder-primary-hover);
}

.jamit-audio-recorder__download--disabled,
.jamit-audio-recorder__download--disabled:hover {
  color: var(--jamit-recorder-disabled-color);
  background: var(--jamit-recorder-disabled-background);
  cursor: not-allowed;
  pointer-events: none;
}

@container (max-width: 560px) {
  .jamit-audio-recorder {
    padding: 20px;
  }

  .jamit-audio-recorder__meta {
    display: grid;
    gap: 10px;
  }

  .jamit-audio-recorder__controls {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .jamit-audio-recorder__button,
  .jamit-audio-recorder__download {
    width: 100%;
  }
}
</style>