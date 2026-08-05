import type {
    AudioRecording,
    AudioRecorderError,
    RecorderSnapshot,
} from '@codeplayer71/audio-recorder-core';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
    useAudioRecorder,
    type UseAudioRecorderOptions,
} from '../use-audio-recorder';

type AudioConstraints =
    NonNullable<UseAudioRecorderOptions>['audioConstraints'];

type RecorderActions = Pick<
    ReturnType<typeof useAudioRecorder>,
    'start' | 'pause' | 'resume' | 'stop' | 'cancel' | 'reset'
>;

export type JamItAudioRecorderRenderState = {
    snapshot: RecorderSnapshot;
    formattedDuration: string;
    isIdle: boolean;
    isRecording: boolean;
    isPaused: boolean;
    isActive: boolean;
    canReset: boolean;
    canDownload: boolean;
    recording: AudioRecording | null;
    error: AudioRecorderError | null;
} & RecorderActions;

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
    showPlayer?: boolean;
    showDownload?: boolean;
    showCancel?: boolean;
    showReset?: boolean;
    className?: string;
    renderHeader?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderStatus?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderDuration?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderControls?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderError?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderPlayer?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderDownload?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
    renderFooter?: (
        state: JamItAudioRecorderRenderState,
    ) => ReactNode;
};

export function JamItAudioRecorder({
                                       title = 'Audio Recorder',
                                       startLabel = 'Start recording',
                                       pauseLabel = 'Pause',
                                       resumeLabel = 'Resume',
                                       stopLabel = 'Stop',
                                       cancelLabel = 'Cancel',
                                       resetLabel = 'Reset',
                                       downloadLabel = 'Download recording',
                                       statusLabel = 'Status',
                                       durationLabel = 'Duration',
                                       maxDurationMs = 120_000,
                                       maxFileSizeBytes = 10_000_000,
                                       audioConstraints = {
                                           channelCount: 1,
                                           echoCancellation: true,
                                           noiseSuppression: true,
                                           autoGainControl: true,
                                       },
                                       showTitle = true,
                                       showStatus = true,
                                       showDuration = true,
                                       showPlayer = true,
                                       showDownload = true,
                                       showCancel = true,
                                       showReset = true,
                                       className,
                                       renderHeader,
                                       renderStatus,
                                       renderDuration,
                                       renderControls,
                                       renderError,
                                       renderPlayer,
                                       renderDownload,
                                       renderFooter,
                                   }: JamItAudioRecorderProps) {
    const {
        snapshot,
        start,
        pause,
        resume,
        stop,
        cancel,
        reset,
    } = useAudioRecorder({
        maxDurationMs,
        maxFileSizeBytes,
        audioConstraints,
    });

    const formattedDuration = useMemo(() => {
        const totalSeconds = Math.floor(snapshot.durationMs / 1_000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, [snapshot.durationMs]);

    const isIdle = snapshot.state === 'idle';
    const isRecording = snapshot.state === 'recording';
    const isPaused = snapshot.state === 'paused';
    const isActive = isRecording || isPaused;
    const canReset =
        snapshot.recording !== null ||
        snapshot.error !== null;
    const canDownload = snapshot.recording !== null;

    const renderState: JamItAudioRecorderRenderState = {
        snapshot,
        formattedDuration,
        isIdle,
        isRecording,
        isPaused,
        isActive,
        canReset,
        canDownload,
        recording: snapshot.recording,
        error: snapshot.error,
        start,
        pause,
        resume,
        stop,
        cancel,
        reset,
    };

    return (
        <section
            className={[
                'jamit-audio-recorder',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {renderHeader
                ? renderHeader(renderState)
                : showTitle && (
                <header className="jamit-audio-recorder__header">
                    <h2 className="jamit-audio-recorder__title">
                        {title}
                    </h2>
                </header>
            )}

            <div className="jamit-audio-recorder__meta">
                {renderStatus
                    ? renderStatus(renderState)
                    : showStatus && (
                    <p className="jamit-audio-recorder__status">
              <span className="jamit-audio-recorder__label">
                {statusLabel}
              </span>

                        <strong className="jamit-audio-recorder__state">
                            {snapshot.state}
                        </strong>
                    </p>
                )}

                {renderDuration
                    ? renderDuration(renderState)
                    : showDuration && (
                    <p className="jamit-audio-recorder__duration">
              <span className="jamit-audio-recorder__label">
                {durationLabel}
              </span>

                        <strong>{formattedDuration}</strong>
                    </p>
                )}
            </div>

            {renderControls
                ? renderControls(renderState)
                : (
                    <div className="jamit-audio-recorder__controls">
                        <button
                            type="button"
                            className="
                jamit-audio-recorder__button
                jamit-audio-recorder__button--primary
              "
                            disabled={!isIdle}
                            onClick={() => void start()}
                        >
                            <svg
                                className="jamit-audio-recorder__icon"
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

                            <span>{startLabel}</span>
                        </button>

                        <button
                            type="button"
                            className="jamit-audio-recorder__button"
                            disabled={!isRecording}
                            onClick={pause}
                        >
                            <svg
                                className="jamit-audio-recorder__icon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M7 5h4v14H7zM13 5h4v14h-4z"
                                    fill="currentColor"
                                />
                            </svg>

                            <span>{pauseLabel}</span>
                        </button>

                        <button
                            type="button"
                            className="jamit-audio-recorder__button"
                            disabled={!isPaused}
                            onClick={resume}
                        >
                            <svg
                                className="jamit-audio-recorder__icon"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path
                                    d="M8 5v14l11-7z"
                                    fill="currentColor"
                                />
                            </svg>

                            <span>{resumeLabel}</span>
                        </button>

                        <button
                            type="button"
                            className="jamit-audio-recorder__button"
                            disabled={!isActive}
                            onClick={() => void stop()}
                        >
                            <svg
                                className="jamit-audio-recorder__icon"
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

                            <span>{stopLabel}</span>
                        </button>

                        {showCancel && (
                            <button
                                type="button"
                                className="
                  jamit-audio-recorder__button
                  jamit-audio-recorder__button--danger
                "
                                disabled={!isActive}
                                onClick={cancel}
                            >
                                <svg
                                    className="jamit-audio-recorder__icon"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M7 7l10 10M17 7L7 17"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeWidth="2.5"
                                    />
                                </svg>

                                <span>{cancelLabel}</span>
                            </button>
                        )}

                        {showReset && (
                            <button
                                type="button"
                                className="jamit-audio-recorder__button"
                                disabled={!canReset}
                                onClick={reset}
                            >
                                <svg
                                    className="jamit-audio-recorder__icon"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M5 8V4m0 0h4M5 4l3 3a7 7 0 1 1-1.45 7.62"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                    />
                                </svg>

                                <span>{resetLabel}</span>
                            </button>
                        )}
                    </div>
                )}

            {renderError
                ? renderError(renderState)
                : snapshot.error && (
                <p
                    className="jamit-audio-recorder__error"
                    role="alert"
                >
                    {snapshot.error.message}
                </p>
            )}

            {renderPlayer
                ? renderPlayer(renderState)
                : showPlayer &&
                snapshot.recording && (
                    <audio
                        className="jamit-audio-recorder__player"
                        src={snapshot.recording.url}
                        controls
                    />
                )}

            {renderDownload
                ? renderDownload(renderState)
                : showDownload && (
                <a
                    className={[
                        'jamit-audio-recorder__download',
                        !canDownload
                            ? 'jamit-audio-recorder__download--disabled'
                            : '',
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    href={snapshot.recording?.url}
                    download={snapshot.recording?.file.name}
                    aria-disabled={!canDownload}
                    tabIndex={canDownload ? 0 : -1}
                >
                    <svg
                        className="jamit-audio-recorder__icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                        />
                    </svg>

                    <span>{downloadLabel}</span>
                </a>
            )}

            {renderFooter?.(renderState)}
        </section>
    );
}