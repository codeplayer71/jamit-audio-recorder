import {
    createAudioRecorderError,
    mapMediaAccessError,
} from './audio-recorder-error';
import {
    detectAudioRecorderBrowserSupport,
    getDefaultBrowserEnvironment,
    type AudioRecorderBrowserEnvironment,
} from './browser-support';
import {
    normalizeAudioRecorderOptions,
} from './normalize-options';
import type {
    AudioRecorderOptions,
} from './options';
import {
    createRecorderStore,
} from './recorder-store';
import {
    selectSupportedMimeType,
} from './select-supported-mime-type';

import {
    getFileExtensionFromMimeType,
} from './get-file-extension';

import type {
    AudioRecording,
    RecorderSnapshot,
} from './types';

const DURATION_UPDATE_INTERVAL_MS = 100;
const AUDIO_CHUNK_INTERVAL_MS = 1_000;

export type AudioRecorder = {
    getSnapshot: () => RecorderSnapshot;
    subscribe: (
        subscriber: (snapshot: RecorderSnapshot) => void,
    ) => () => void;
    start: () => Promise<void>;
    pause: () => void;
    resume: () => void;
    stop: () => Promise<AudioRecording>;
    cancel: () => void;
    reset: () => void;
    destroy: () => void;
};

export type CreateAudioRecorderOptions =
    AudioRecorderOptions & {
    environment?: AudioRecorderBrowserEnvironment;
};

export function createAudioRecorder(
    options: CreateAudioRecorderOptions = {},
): AudioRecorder {
    const {
        environment,
        ...audioRecorderOptions
    } = options;

    const normalizedOptions =
        normalizeAudioRecorderOptions(audioRecorderOptions);

    const browserEnvironment =
        environment ?? getDefaultBrowserEnvironment();

    const store = createRecorderStore();

    let mediaStream: MediaStream | null = null;
    let mediaRecorder: MediaRecorder | null = null;
    let audioChunks: Blob[] = [];
    let recordedSizeBytes = 0;
    let maxFileSizeExceeded = false;
    let recordingUrl: string | null = null;
    let recordingStartedAt: number | null = null;
    let accumulatedDurationMs = 0;
    let durationTimer: ReturnType<typeof setInterval> | null = null;
    let maxDurationTimer: ReturnType<typeof setTimeout> | null = null;
    let maxDurationExceeded = false;
    let isDestroyed = false;

    function assertNotDestroyed(): void {
        if (isDestroyed) {
            throw new Error('Audio recorder has been destroyed.');
        }
    }

    function assertState(expectedState: RecorderSnapshot['state']): void {
        const currentState = store.getSnapshot().state;

        if (currentState !== expectedState) {
            throw createAudioRecorderError(
                'invalid-state',
                `Expected recorder state "${expectedState}", but received "${currentState}".`,
            );
        }
    }

    function assertStateIn(
        expectedStates: readonly RecorderSnapshot['state'][],
    ): void {
        const currentState = store.getSnapshot().state;

        if (!expectedStates.includes(currentState)) {
            throw createAudioRecorderError(
                'invalid-state',
                `Expected recorder state to be one of "${expectedStates.join(
                    '", "',
                )}", but received "${currentState}".`,
            );
        }
    }

    function stopMediaTracks(): void {
        for (const track of mediaStream?.getTracks() ?? []) {
            track.stop();
        }

        mediaStream = null;
    }

    function revokeRecordingUrl(): void {
        if (recordingUrl === null) {
            return;
        }

        URL.revokeObjectURL(recordingUrl);
        recordingUrl = null;
    }

    function getCurrentDurationMs(): number {
        if (recordingStartedAt === null) {
            return accumulatedDurationMs;
        }

        return (
            accumulatedDurationMs +
            Math.max(0, Date.now() - recordingStartedAt)
        );
    }

    function publishDuration(): void {
        store.update({
            durationMs: getCurrentDurationMs(),
        });
    }

    function startDurationTimer(): void {
        recordingStartedAt = Date.now();

        durationTimer = setInterval(
            publishDuration,
            DURATION_UPDATE_INTERVAL_MS,
        );
    }

    function pauseDurationTimer(): void {
        accumulatedDurationMs = getCurrentDurationMs();
        recordingStartedAt = null;

        if (durationTimer !== null) {
            clearInterval(durationTimer);
            durationTimer = null;
        }

        store.update({
            durationMs: accumulatedDurationMs,
        });
    }

    function resetDurationTimer(): void {
        if (durationTimer !== null) {
            clearInterval(durationTimer);
            durationTimer = null;
        }

        recordingStartedAt = null;
        accumulatedDurationMs = 0;
    }

    function clearMaxDurationTimer(): void {
        if (maxDurationTimer !== null) {
            clearTimeout(maxDurationTimer);
            maxDurationTimer = null;
        }
    }

    function hasExceededMaxFileSize(): boolean {
        return (
            normalizedOptions.maxFileSizeBytes !== null &&
            recordedSizeBytes > normalizedOptions.maxFileSizeBytes
        );
    }

    function startMaxDurationTimer(): void {
        clearMaxDurationTimer();

        if (normalizedOptions.maxDurationMs === null) {
            return;
        }

        const remainingDurationMs =
            normalizedOptions.maxDurationMs - getCurrentDurationMs();

        if (remainingDurationMs <= 0) {
            return;
        }

        maxDurationTimer = setTimeout(() => {
            maxDurationTimer = null;
            maxDurationExceeded = true;

            const currentState = store.getSnapshot().state;

            if (
                currentState !== 'recording' &&
                currentState !== 'paused'
            ) {
                return;
            }

            void stop().catch(() => undefined);
        }, remainingDurationMs);
    }

    async function stop(): Promise<AudioRecording> {
        assertNotDestroyed();
        assertStateIn([
            'recording',
            'paused',
        ]);

        if (mediaRecorder === null) {
            throw createAudioRecorderError(
                'recording-failed',
                'The active MediaRecorder instance is unavailable.',
            );
        }

        const activeMediaRecorder = mediaRecorder;

        pauseDurationTimer();
        clearMaxDurationTimer();

        store.transition('processing');

        return new Promise<AudioRecording>(
            (resolve, reject) => {
                activeMediaRecorder.onstop = (): void => {
                    try {
                        if (maxDurationExceeded) {
                            stopMediaTracks();

                            mediaRecorder = null;
                            audioChunks = [];
                            recordedSizeBytes = 0;
                            maxFileSizeExceeded = false;
                            maxDurationExceeded = false;

                            const error = createAudioRecorderError(
                                'max-duration-exceeded',
                                'The maximum audio recording duration was exceeded.',
                            );

                            store.transition('error', {
                                recording: null,
                                error,
                            });

                            reject(error);
                            return;
                        }

                        if (maxFileSizeExceeded) {
                            stopMediaTracks();

                            mediaRecorder = null;
                            audioChunks = [];
                            recordedSizeBytes = 0;
                            maxFileSizeExceeded = false;
                            maxDurationExceeded = false;

                            const error = createAudioRecorderError(
                                'max-file-size-exceeded',
                                'The maximum audio recording file size was exceeded.',
                            );

                            store.transition('error', {
                                recording: null,
                                error,
                            });

                            reject(error);
                            return;
                        }
                        const mimeType =
                            activeMediaRecorder.mimeType ||
                            normalizedOptions.preferredMimeTypes[0] ||
                            'audio/webm';

                        const extension =
                            getFileExtensionFromMimeType(mimeType);

                        const blob = new Blob(audioChunks, {
                            type: mimeType,
                        });

                        const file = new File(
                            [blob],
                            `${normalizedOptions.fileName}.${extension}`,
                            {
                                type: mimeType,
                                lastModified: Date.now(),
                            },
                        );

                        revokeRecordingUrl();

                        recordingUrl = URL.createObjectURL(blob);

                        const recording: AudioRecording = {
                            blob,
                            file,
                            url: recordingUrl,
                            durationMs: store.getSnapshot().durationMs,
                            sizeBytes: blob.size,
                            mimeType,
                            extension,
                            createdAt: new Date(),
                        };

                        stopMediaTracks();

                        mediaRecorder = null;
                        audioChunks = [];
                        recordedSizeBytes = 0;
                        maxFileSizeExceeded = false;
                        maxDurationExceeded = false;

                        store.transition('completed', {
                            recording,
                            error: null,
                        });

                        resolve(recording);
                    } catch (originalError) {
                        stopMediaTracks();

                        mediaRecorder = null;
                        audioChunks = [];
                        recordedSizeBytes = 0;
                        maxFileSizeExceeded = false;
                        maxDurationExceeded = false;

                        const error = createAudioRecorderError(
                            'recording-failed',
                            'The audio recording result could not be created.',
                            originalError,
                        );

                        store.transition('error', {
                            error,
                        });

                        reject(error);
                    }
                };

                activeMediaRecorder.onerror = (
                    event: Event,
                ): void => {
                    stopMediaTracks();

                    mediaRecorder = null;
                    audioChunks = [];
                    recordedSizeBytes = 0;
                    maxFileSizeExceeded = false;
                    maxDurationExceeded = false;

                    const error = createAudioRecorderError(
                        'recording-failed',
                        'The audio recording could not be stopped.',
                        event,
                    );

                    store.transition('error', {
                        error,
                    });

                    reject(error);
                };

                try {
                    activeMediaRecorder.stop();
                } catch (originalError) {
                    stopMediaTracks();

                    mediaRecorder = null;
                    audioChunks = [];
                    recordedSizeBytes = 0;
                    maxFileSizeExceeded = false;
                    maxDurationExceeded = false;

                    const error = createAudioRecorderError(
                        'recording-failed',
                        'The audio recording could not be stopped.',
                        originalError,
                    );

                    store.transition('error', {
                        error,
                    });

                    reject(error);
                }
            },
        );
    }

    return {
        getSnapshot: store.getSnapshot,

        subscribe: store.subscribe,

        async start(): Promise<void> {
            assertNotDestroyed();
            assertState('idle');

            const support =
                detectAudioRecorderBrowserSupport(browserEnvironment);

            if (!support.isSupported) {
                const error = createAudioRecorderError(
                    'unsupported-browser',
                    'Audio recording is not supported in this environment.',
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }

            const navigatorApi = browserEnvironment.navigator;
            const MediaRecorderConstructor =
                browserEnvironment.MediaRecorder;

            if (
                navigatorApi === undefined ||
                MediaRecorderConstructor === undefined
            ) {
                const error = createAudioRecorderError(
                    'unsupported-browser',
                    'Audio recording is not supported in this environment.',
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }

            store.transition('requesting-permission', {
                error: null,
            });

            try {
                mediaStream =
                    await navigatorApi.mediaDevices.getUserMedia({
                        audio: normalizedOptions.audioConstraints,
                    });
            } catch (originalError) {
                const error = mapMediaAccessError(originalError);

                store.transition('error', {
                    error,
                });

                throw error;
            }

            const mimeType = selectSupportedMimeType(
                normalizedOptions.preferredMimeTypes,
                MediaRecorderConstructor.isTypeSupported,
            );

            if (mimeType === null) {
                for (const track of mediaStream.getTracks()) {
                    track.stop();
                }

                mediaStream = null;

                const error = createAudioRecorderError(
                    'unsupported-mime-type',
                    'None of the preferred audio MIME types are supported.',
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }

            try {
                audioChunks = [];
                recordedSizeBytes = 0;
                maxFileSizeExceeded = false;
                maxDurationExceeded = false;

                mediaRecorder = new MediaRecorderConstructor(
                    mediaStream,
                    {
                        mimeType,
                    },
                );

                mediaRecorder.ondataavailable = (
                    event: BlobEvent,
                ): void => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                        recordedSizeBytes += event.data.size;

                        if (
                            hasExceededMaxFileSize() &&
                            !maxFileSizeExceeded
                        ) {
                            maxFileSizeExceeded = true;

                            const currentState = store.getSnapshot().state;

                            if (
                                currentState === 'recording' ||
                                currentState === 'paused'
                            ) {
                                void stop().catch(() => undefined);
                            }
                        }
                    }
                };

                mediaRecorder.start(AUDIO_CHUNK_INTERVAL_MS);

                resetDurationTimer();

                store.transition('recording', {
                    durationMs: 0,
                    recording: null,
                    error: null,
                });

                startDurationTimer();
                startMaxDurationTimer();
            } catch (originalError) {
                for (const track of mediaStream.getTracks()) {
                    track.stop();
                }

                mediaStream = null;
                mediaRecorder = null;
                audioChunks = [];
                recordedSizeBytes = 0;
                maxFileSizeExceeded = false;
                maxDurationExceeded = false;
                resetDurationTimer();
                clearMaxDurationTimer();

                const error = createAudioRecorderError(
                    'recording-failed',
                    'The audio recording could not be started.',
                    originalError,
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }
        },

        pause(): void {
            assertNotDestroyed();
            assertState('recording');

            if (mediaRecorder === null) {
                throw createAudioRecorderError(
                    'recording-failed',
                    'The active MediaRecorder instance is unavailable.',
                );
            }

            try {
                mediaRecorder.pause();
                pauseDurationTimer();
                clearMaxDurationTimer();
                store.transition('paused');
            } catch (originalError) {
                resetDurationTimer();
                clearMaxDurationTimer();
                stopMediaTracks();

                mediaRecorder = null;
                audioChunks = [];
                recordedSizeBytes = 0;
                maxFileSizeExceeded = false;

                const error = createAudioRecorderError(
                    'recording-failed',
                    'The audio recording could not be paused.',
                    originalError,
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }
        },

        resume(): void {
            assertNotDestroyed();
            assertState('paused');

            if (mediaRecorder === null) {
                throw createAudioRecorderError(
                    'recording-failed',
                    'The active MediaRecorder instance is unavailable.',
                );
            }

            try {
                mediaRecorder.resume();
                store.transition('recording');
                startDurationTimer();
                startMaxDurationTimer();
            } catch (originalError) {
                resetDurationTimer();
                clearMaxDurationTimer();
                stopMediaTracks();

                mediaRecorder = null;
                audioChunks = [];
                recordedSizeBytes = 0;
                maxFileSizeExceeded = false;

                const error = createAudioRecorderError(
                    'recording-failed',
                    'The audio recording could not be resumed.',
                    originalError,
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }
        },

        stop,

        cancel(): void {
            assertNotDestroyed();
            assertStateIn([
                'recording',
                'paused',
            ]);

            if (mediaRecorder === null) {
                throw createAudioRecorderError(
                    'recording-failed',
                    'The active MediaRecorder instance is unavailable.',
                );
            }

            const activeMediaRecorder = mediaRecorder;

            try {
                activeMediaRecorder.ondataavailable = null;
                activeMediaRecorder.onstop = null;
                activeMediaRecorder.onerror = null;

                activeMediaRecorder.stop();

                resetDurationTimer();
                clearMaxDurationTimer();
                stopMediaTracks();

                mediaRecorder = null;
                audioChunks = [];
                recordedSizeBytes = 0;
                maxFileSizeExceeded = false;
                maxDurationExceeded = false;

                store.transition('idle', {
                    durationMs: 0,
                    recording: null,
                    error: null,
                });
            } catch (originalError) {
                resetDurationTimer();
                clearMaxDurationTimer();
                stopMediaTracks();

                mediaRecorder = null;
                audioChunks = [];
                recordedSizeBytes = 0;
                maxFileSizeExceeded = false;
                maxDurationExceeded = false;

                const error = createAudioRecorderError(
                    'recording-failed',
                    'The audio recording could not be cancelled.',
                    originalError,
                );

                store.transition('error', {
                    error,
                });

                throw error;
            }
        },

        reset(): void {
            assertNotDestroyed();

            const snapshot = store.getSnapshot();

            if (
                snapshot.state !== 'completed' &&
                snapshot.state !== 'error'
            ) {
                throw createAudioRecorderError(
                    'invalid-state',
                    `Cannot reset the recorder while it is in the "${snapshot.state}" state.`,
                );
            }

            resetDurationTimer();
            clearMaxDurationTimer();
            revokeRecordingUrl();
            recordedSizeBytes = 0;
            maxFileSizeExceeded = false;
            maxDurationExceeded = false;

            store.transition('idle', {
                durationMs: 0,
                recording: null,
                error: null,
            });
        },

        destroy(): void {
            if (isDestroyed) {
                return;
            }

            if (
                mediaRecorder !== null &&
                mediaRecorder.state !== 'inactive'
            ) {
                mediaRecorder.ondataavailable = null;
                mediaRecorder.onstop = null;
                mediaRecorder.onerror = null;

                try {
                    mediaRecorder.stop();
                } catch {
                    // Cleanup continues even if MediaRecorder.stop() fails.
                }
            }

            resetDurationTimer();
            clearMaxDurationTimer();
            stopMediaTracks();
            revokeRecordingUrl();

            mediaRecorder = null;
            audioChunks = [];
            recordedSizeBytes = 0;
            maxFileSizeExceeded = false;
            maxDurationExceeded = false;

            store.destroy();
            isDestroyed = true;
        },
    };
}