import { useAudioRecorder } from '@jamit/audio-recorder-react';
import { useMemo } from 'react';

function App() {
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

  const formattedDuration = useMemo(() => {
    const totalSeconds = Math.floor(snapshot.durationMs / 1_000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [snapshot.durationMs]);

  return (
      <main className="recorder">
        <h1>JamIT Audio Recorder</h1>

        <p className="recorder__status">
          Status: <strong>{snapshot.state}</strong>
        </p>

        <p>Duration: {formattedDuration}</p>

        <div className="recorder__actions">
          <button
              type="button"
              disabled={snapshot.state !== 'idle'}
              onClick={() => void start()}
          >
            Start
          </button>

          <button
              type="button"
              disabled={snapshot.state !== 'recording'}
              onClick={pause}
          >
            Pause
          </button>

          <button
              type="button"
              disabled={snapshot.state !== 'paused'}
              onClick={resume}
          >
            Resume
          </button>

          <button
              type="button"
              disabled={!['recording', 'paused'].includes(snapshot.state)}
              onClick={() => void stop()}
          >
            Stop
          </button>

          <button
              type="button"
              disabled={!['recording', 'paused'].includes(snapshot.state)}
              onClick={cancel}
          >
            Cancel
          </button>

          <button
              type="button"
              disabled={snapshot.recording === null && snapshot.error === null}
              onClick={reset}
          >
            Reset
          </button>
        </div>

        {snapshot.error ? (
            <p className="recorder__error">{snapshot.error.message}</p>
        ) : null}

        {snapshot.recording ? (
            <audio
                src={snapshot.recording.url}
                controls
            />
        ) : null}

        <a
            className={[
              'recorder__download',
              snapshot.recording === null
                  ? 'recorder__download--disabled'
                  : '',
            ]
                .filter(Boolean)
                .join(' ')}
            href={snapshot.recording?.url}
            download={snapshot.recording?.file.name}
            aria-disabled={snapshot.recording === null}
            tabIndex={snapshot.recording ? 0 : -1}
        >
          Download recording
        </a>
        <footer className="recorder__footer">
          Created by{' '}
          <a
              href="https://jamit.one"
              target="_blank"
              rel="noopener noreferrer"
          >
            JamIT
          </a>
        </footer>
      </main>
  );
}

export default App;