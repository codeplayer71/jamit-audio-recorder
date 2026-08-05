import {
    createAudioRecorder,
    type RecorderSnapshot,
} from '@jamit/audio-recorder-core';
import './style.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (app === null) {
    throw new Error('App element was not found.');
}

app.innerHTML = `
  <main class="jamit-audio-recorder">
    <header class="jamit-audio-recorder__header">
      <h1 class="jamit-audio-recorder__title">
        Audio Recorder
      </h1>
    </header>

    <div class="jamit-audio-recorder__meta">
      <p class="jamit-audio-recorder__status">
        <span class="jamit-audio-recorder__label">
          Status
        </span>

        <strong
          id="recorder-state"
          class="jamit-audio-recorder__state"
        >
          idle
        </strong>
      </p>

      <p class="jamit-audio-recorder__duration">
        <span class="jamit-audio-recorder__label">
          Duration
        </span>

        <strong id="recorder-duration">
          00:00
        </strong>
      </p>
    </div>

    <div class="jamit-audio-recorder__controls">
      <button
        id="recorder-start"
        type="button"
        class="
          jamit-audio-recorder__button
          jamit-audio-recorder__button--primary
        "
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

        <span>Start recording</span>
      </button>

      <button
        id="recorder-pause"
        type="button"
        class="jamit-audio-recorder__button"
        disabled
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

        <span>Pause</span>
      </button>

      <button
        id="recorder-resume"
        type="button"
        class="jamit-audio-recorder__button"
        disabled
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

        <span>Resume</span>
      </button>

      <button
        id="recorder-stop"
        type="button"
        class="jamit-audio-recorder__button"
        disabled
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

        <span>Stop</span>
      </button>

      <button
        id="recorder-cancel"
        type="button"
        class="
          jamit-audio-recorder__button
          jamit-audio-recorder__button--danger
        "
        disabled
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

        <span>Cancel</span>
      </button>

      <button
        id="recorder-reset"
        type="button"
        class="jamit-audio-recorder__button"
        disabled
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

        <span>Reset</span>
      </button>
    </div>

    <p
      id="recorder-error"
      class="jamit-audio-recorder__error"
      role="alert"
      hidden
    ></p>

    <audio
      id="recorder-audio"
      class="jamit-audio-recorder__player"
      controls
      hidden
    ></audio>

    <a
      id="recorder-download"
      class="
        jamit-audio-recorder__download
        jamit-audio-recorder__download--disabled
      "
      aria-disabled="true"
      tabindex="-1"
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

      <span>Download recording</span>
    </a>

    <footer class="jamit-audio-recorder__footer">
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
`;

function getRequiredElement<T extends Element>(
    selector: string,
): T {
    const element = document.querySelector<T>(selector);

    if (element === null) {
        throw new Error(`Required element was not found: ${selector}`);
    }

    return element;
}

const stateElement =
    getRequiredElement<HTMLElement>('#recorder-state');

const durationElement =
    getRequiredElement<HTMLElement>('#recorder-duration');

const errorElement =
    getRequiredElement<HTMLParagraphElement>('#recorder-error');

const audioElement =
    getRequiredElement<HTMLAudioElement>('#recorder-audio');

const downloadElement =
    getRequiredElement<HTMLAnchorElement>('#recorder-download');

const startButton =
    getRequiredElement<HTMLButtonElement>('#recorder-start');

const pauseButton =
    getRequiredElement<HTMLButtonElement>('#recorder-pause');

const resumeButton =
    getRequiredElement<HTMLButtonElement>('#recorder-resume');

const stopButton =
    getRequiredElement<HTMLButtonElement>('#recorder-stop');

const cancelButton =
    getRequiredElement<HTMLButtonElement>('#recorder-cancel');

const resetButton =
    getRequiredElement<HTMLButtonElement>('#recorder-reset');

const recorder = createAudioRecorder({
    maxDurationMs: 120_000,
    maxFileSizeBytes: 10_000_000,
    audioConstraints: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    },
});

function formatDuration(durationMs: number): string {
    const totalSeconds = Math.floor(durationMs / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateUi(snapshot: RecorderSnapshot): void {
    const isIdle = snapshot.state === 'idle';
    const isRecording = snapshot.state === 'recording';
    const isPaused = snapshot.state === 'paused';
    const isActive = isRecording || isPaused;
    const canReset =
        snapshot.recording !== null ||
        snapshot.error !== null;
    const canDownload = snapshot.recording !== null;

    stateElement.textContent = snapshot.state;
    durationElement.textContent = formatDuration(
        snapshot.durationMs,
    );

    startButton.disabled = !isIdle;
    pauseButton.disabled = !isRecording;
    resumeButton.disabled = !isPaused;
    stopButton.disabled = !isActive;
    cancelButton.disabled = !isActive;
    resetButton.disabled = !canReset;

    if (snapshot.error === null) {
        errorElement.hidden = true;
        errorElement.textContent = '';
    } else {
        errorElement.hidden = false;
        errorElement.textContent = snapshot.error.message;
    }

    if (snapshot.recording === null) {
        audioElement.hidden = true;
        audioElement.pause();
        audioElement.removeAttribute('src');
        audioElement.load();

        downloadElement.removeAttribute('href');
        downloadElement.removeAttribute('download');
        downloadElement.classList.add(
            'jamit-audio-recorder__download--disabled',
        );
        downloadElement.setAttribute('aria-disabled', 'true');
        downloadElement.tabIndex = -1;
    } else {
        audioElement.hidden = false;
        audioElement.src = snapshot.recording.url;

        downloadElement.href = snapshot.recording.url;
        downloadElement.download = snapshot.recording.file.name;
        downloadElement.classList.remove(
            'jamit-audio-recorder__download--disabled',
        );
        downloadElement.setAttribute('aria-disabled', 'false');
        downloadElement.tabIndex = 0;
    }

    downloadElement.classList.toggle(
        'jamit-audio-recorder__download--disabled',
        !canDownload,
    );
}

const unsubscribe = recorder.subscribe(updateUi);

updateUi(recorder.getSnapshot());

startButton.addEventListener('click', () => {
    void recorder.start();
});

pauseButton.addEventListener('click', () => {
    recorder.pause();
});

resumeButton.addEventListener('click', () => {
    recorder.resume();
});

stopButton.addEventListener('click', () => {
    void recorder.stop();
});

cancelButton.addEventListener('click', () => {
    recorder.cancel();
});

resetButton.addEventListener('click', () => {
    recorder.reset();
});

window.addEventListener(
    'beforeunload',
    () => {
        unsubscribe();
        recorder.destroy();
    },
    {
        once: true,
    },
);