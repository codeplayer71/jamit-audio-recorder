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
    getFileExtensionFromMimeType,
} from './get-file-extension';
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
import type {
    AudioRecording,
    RecorderSnapshot,
} from './types';

const DURATION_UPDATE_INTERVAL_MS = 100;
const AUDIO_CHUNK_INTERVAL_MS = 1_000;

const AUDIO_LEVEL_FFT_SIZE = 2_048;
const AUDIO_LEVEL_SENSITIVITY = 3.5;
const AUDIO_LEVEL_SMOOTHING_FACTOR = 0.3;
const AUDIO_LEVEL_UPDATE_THRESHOLD = 0.01;
const AUDIO_LEVEL_SILENCE_THRESHOLD = 0.005;

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
    let audioContext: AudioContext | null = null;
    let audioSourceNode: MediaStreamAudioSourceNode | null = null;
    let analyserNode: AnalyserNode | null = null;

    let audioLevelBuffer: Uint8Array<ArrayBuffer> | null = null;
    let audioLevelAnimationFrameId: number | null = null;
    let smoothedAudioLevel = 0;

    function assertNotDestroyed(): void {
        if (isDestroyed) {
            throw new Error('Audio recorder has been destroyed.');
        }
    }

    function assertState(
        expectedState: RecorderSnapshot['state'],
    ): void {
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

    function calculateAudioLevel(
        samples: Uint8Array<ArrayBuffer>,
    ): number {
        let sum = 0;

        for (const sample of samples) {
            const normalizedSample = (sample - 128) / 128;

            sum += normalizedSample * normalizedSample;
        }

        const rms = Math.sqrt(sum / samples.length);

        return Math.min(
            1,
            Math.max(0, rms * AUDIO_LEVEL_SENSITIVITY),
        );
    }

    function monitorAudioLevel(): void {
        if (
            analyserNode === null ||
            audioLevelBuffer === null
        ) {
            return;
        }

        analyserNode.getByteTimeDomainData(audioLevelBuffer);

        const currentLevel =
            calculateAudioLevel(audioLevelBuffer);

        smoothedAudioLevel =
            smoothedAudioLevel *
            (1 - AUDIO_LEVEL_SMOOTHING_FACTOR) +
            currentLevel * AUDIO_LEVEL_SMOOTHING_FACTOR;

        const nextLevel =
            smoothedAudioLevel < AUDIO_LEVEL_SILENCE_THRESHOLD
                ? 0
                : Math.min(1, Math.max(0, smoothedAudioLevel));

        const previousLevel =
            store.getSnapshot().audioLevel;

        if (
            Math.abs(previousLevel - nextLevel) >=
            AUDIO_LEVEL_UPDATE_THRESHOLD ||
            (nextLevel === 0 && previousLevel !== 0)
        ) {
            store.update({
                audioLevel: nextLevel,
            });
        }

        const requestAnimationFrame =
            browserEnvironment.requestAnimationFrame;

        if (requestAnimationFrame === undefined) {
            return;
        }

        audioLevelAnimationFrameId =
            requestAnimationFrame(monitorAudioLevel);
    }

    function stopAudioLevelMonitoring(): void {
        if (audioLevelAnimationFrameId !== null) {
            browserEnvironment.cancelAnimationFrame?.(
                audioLevelAnimationFrameId,
            );

            audioLevelAnimationFrameId = null;
        }

        try {
            audioSourceNode?.disconnect();
        } catch {
            // Cleanup continues if the source node is already disconnected.
        }

        try {
            analyserNode?.disconnect();
        } catch {
            // Cleanup continues if the analyser node is already disconnected.
        }

        if (audioContext !== null) {
            void audioContext.close().catch(() => undefined);
        }

        audioSourceNode = null;
        analyserNode = null;
        audioContext = null;

        // NEW
        audioLevelBuffer = null;
        smoothedAudioLevel = 0;

        store.update({
            audioLevel: 0,
        });
    }

    function startAudioLevelMonitoring(
        stream: MediaStream,
    ): void {
        stopAudioLevelMonitoring();

        const AudioContextConstructor =
            browserEnvironment.AudioContext;

        const requestAnimationFrame =
            browserEnvironment.requestAnimationFrame;

        if (
            AudioContextConstructor === undefined ||
            requestAnimationFrame === undefined
        ) {
            return;
        }

        try {
            audioContext = new AudioContextConstructor();

            audioSourceNode =
                audioContext.createMediaStreamSource(stream);

            analyserNode = audioContext.createAnalyser();

            analyserNode.fftSize = AUDIO_LEVEL_FFT_SIZE;

            audioLevelBuffer = new Uint8Array(
                analyserNode.fftSize,
            );

            audioSourceNode.connect(analyserNode);

            if (audioContext.state === 'suspended') {
                void audioContext.resume().catch(() => undefined);
            }

            audioLevelAnimationFrameId =
                requestAnimationFrame(monitorAudioLevel);
        } catch {
            stopAudioLevelMonitoring();
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

    function resetRecordingData(): void {
        mediaRecorder = null;
        audioChunks = [];
        recordedSizeBytes = 0;
        maxFileSizeExceeded = false;
        maxDurationExceeded = false;
    }

    function cleanupStoppedRecording(): void {
        stopAudioLevelMonitoring();
        stopMediaTracks();
        resetRecordingData();
    }

    function cleanupActiveRecording(): void {
        resetDurationTimer();
        clearMaxDurationTimer();
        cleanupStoppedRecording();
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

        stopAudioLevelMonitoring();

        store.transition('processing', {
            audioLevel: 0,
        });

        return new Promise<AudioRecording>(
            (resolve, reject) => {
                activeMediaRecorder.onstop = (): void => {
                    try {
                        if (maxDurationExceeded) {
                            cleanupStoppedRecording();

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
                            cleanupStoppedRecording();

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

                        cleanupStoppedRecording();

                        store.transition('completed', {
                            recording,
                            error: null,
                        });

                        resolve(recording);
                    } catch (originalError) {
                        cleanupStoppedRecording();

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
                    cleanupStoppedRecording();

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
                    cleanupStoppedRecording();

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
                stopMediaTracks();

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
                resetRecordingData();

                mediaRecorder = new MediaRecorderConstructor(
                    mediaStream,
                    {
                        mimeType,
                    },
                );

                mediaRecorder.ondataavailable = (
                    event: BlobEvent,
                ): void => {
                    if (event.data.size <= 0) {
                        return;
                    }

                    audioChunks.push(event.data);
                    recordedSizeBytes += event.data.size;

                    if (
                        hasExceededMaxFileSize() &&
                        !maxFileSizeExceeded
                    ) {
                        maxFileSizeExceeded = true;

                        const currentState =
                            store.getSnapshot().state;

                        if (
                            currentState === 'recording' ||
                            currentState === 'paused'
                        ) {
                            void stop().catch(() => undefined);
                        }
                    }
                };

                mediaRecorder.start(AUDIO_CHUNK_INTERVAL_MS);

                resetDurationTimer();

                store.transition('recording', {
                    durationMs: 0,
                    recording: null,
                    error: null,
                    audioLevel: 0,
                });

                startAudioLevelMonitoring(mediaStream);
                startDurationTimer();
                startMaxDurationTimer();
            } catch (originalError) {
                cleanupActiveRecording();

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
                stopAudioLevelMonitoring();
                pauseDurationTimer();
                clearMaxDurationTimer();
                store.transition('paused');
            } catch (originalError) {
                cleanupActiveRecording();

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
                if (mediaStream !== null) {
                    startAudioLevelMonitoring(mediaStream);
                }
                store.transition('recording');
                startDurationTimer();
                startMaxDurationTimer();
            } catch (originalError) {
                cleanupActiveRecording();

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

                cleanupActiveRecording();

                store.transition('idle', {
                    durationMs: 0,
                    recording: null,
                    error: null,
                });
            } catch (originalError) {
                cleanupActiveRecording();

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

            cleanupActiveRecording();
            revokeRecordingUrl();

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

            cleanupActiveRecording();
            revokeRecordingUrl();

            store.destroy();
            isDestroyed = true;
        },
    };
}