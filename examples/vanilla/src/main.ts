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
  <main class="recorder">
    <h1>JamIT Audio Recorder</h1>

    <p class="recorder__status">
      Status:
      <strong id="recorder-status">idle</strong>
    </p>

    <p>
      Duration:
      <strong id="recorder-duration">0.0 s</strong>
    </p>

    <div class="recorder__actions">
      <button id="start-button" type="button">Start</button>
      <button id="pause-button" type="button">Pause</button>
      <button id="resume-button" type="button">Resume</button>
      <button id="stop-button" type="button">Stop</button>
      <button id="cancel-button" type="button">Cancel</button>
      <button id="reset-button" type="button">Reset</button>
    </div>

    <p
      id="recorder-error"
      class="recorder__error"
      hidden
    ></p>

    <audio
      id="recorder-audio"
      controls
      hidden
    ></audio>
<a
  id="recorder-download"
  class="recorder__download recorder__download--disabled"
  aria-disabled="true"
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
`;

function getRequiredElement<T extends Element>(
    selector: string,
): T {
    const element = document.querySelector<T>(selector);

    if (element === null) {
        throw new Error(`Element "${selector}" was not found.`);
    }

    return element;
}

const statusElement =
    getRequiredElement<HTMLElement>('#recorder-status');

const durationElement =
    getRequiredElement<HTMLElement>('#recorder-duration');

const errorElement =
    getRequiredElement<HTMLElement>('#recorder-error');

const audioElement =
    getRequiredElement<HTMLAudioElement>('#recorder-audio');

const downloadElement =
    getRequiredElement<HTMLAnchorElement>('#recorder-download');

const startButton =
    getRequiredElement<HTMLButtonElement>('#start-button');

const pauseButton =
    getRequiredElement<HTMLButtonElement>('#pause-button');

const resumeButton =
    getRequiredElement<HTMLButtonElement>('#resume-button');

const stopButton =
    getRequiredElement<HTMLButtonElement>('#stop-button');

const cancelButton =
    getRequiredElement<HTMLButtonElement>('#cancel-button');

const resetButton =
    getRequiredElement<HTMLButtonElement>('#reset-button');

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

function updateUi(snapshot: RecorderSnapshot): void {
    statusElement.textContent = snapshot.state;

    durationElement.textContent =
        `${(snapshot.durationMs / 1_000).toFixed(1)} s`;

    startButton.disabled = snapshot.state !== 'idle';

    pauseButton.disabled =
        snapshot.state !== 'recording';

    resumeButton.disabled =
        snapshot.state !== 'paused';

    stopButton.disabled =
        snapshot.state !== 'recording' &&
        snapshot.state !== 'paused';

    cancelButton.disabled =
        snapshot.state !== 'recording' &&
        snapshot.state !== 'paused';

    resetButton.disabled =
        snapshot.state !== 'completed' &&
        snapshot.state !== 'error';

    if (snapshot.error === null) {
        errorElement.hidden = true;
        errorElement.textContent = '';
    } else {
        errorElement.hidden = false;
        errorElement.textContent =
            `${snapshot.error.code}: ${snapshot.error.message}`;
    }

    if (snapshot.recording === null) {
        audioElement.hidden = true;
        audioElement.pause();
        audioElement.removeAttribute('src');
        audioElement.load();

        downloadElement.removeAttribute('href');
        downloadElement.removeAttribute('download');
        downloadElement.classList.add('recorder__download--disabled');
        downloadElement.setAttribute('aria-disabled', 'true');
        downloadElement.tabIndex = -1;
    } else {
        audioElement.hidden = false;
        audioElement.src = snapshot.recording.url;

        downloadElement.href = snapshot.recording.url;
        downloadElement.download = snapshot.recording.file.name;
        downloadElement.classList.remove('recorder__download--disabled');
        downloadElement.removeAttribute('aria-disabled');
        downloadElement.tabIndex = 0;
    }
}

recorder.subscribe(updateUi);
updateUi(recorder.getSnapshot());

startButton.addEventListener('click', () => {
    void recorder.start().catch(() => undefined);
});

pauseButton.addEventListener('click', () => {
    recorder.pause();
});

resumeButton.addEventListener('click', () => {
    recorder.resume();
});

stopButton.addEventListener('click', () => {
    void recorder.stop().catch(() => undefined);
});

cancelButton.addEventListener('click', () => {
    recorder.cancel();
});

resetButton.addEventListener('click', () => {
    recorder.reset();
});

window.addEventListener('beforeunload', () => {
    recorder.destroy();
});