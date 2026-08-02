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
import type {
    AudioRecording,
    RecorderSnapshot,
} from './types';

import {
    getFileExtensionFromMimeType,
} from './get-file-extension';

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
    let recordingUrl: string | null = null;
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
                    }
                };

                mediaRecorder.start();

                store.transition('recording', {
                    durationMs: 0,
                    recording: null,
                    error: null,
                });
            } catch (originalError) {
                for (const track of mediaStream.getTracks()) {
                    track.stop();
                }

                mediaStream = null;
                mediaRecorder = null;

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
                store.transition('paused');
            } catch (originalError) {
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
            } catch (originalError) {
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

        async stop(): Promise<AudioRecording> {
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

            store.transition('processing');

            return new Promise<AudioRecording>(
                (resolve, reject) => {
                    activeMediaRecorder.onstop = (): void => {
                        try {
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
                                durationMs:
                                store.getSnapshot().durationMs,
                                sizeBytes: blob.size,
                                mimeType,
                                extension,
                                createdAt: new Date(),
                            };

                            stopMediaTracks();

                            mediaRecorder = null;
                            audioChunks = [];

                            store.transition('completed', {
                                recording,
                                error: null,
                            });

                            resolve(recording);
                        } catch (originalError) {
                            stopMediaTracks();

                            mediaRecorder = null;
                            audioChunks = [];

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
        },

        cancel(): void {
            assertNotDestroyed();

            throw new Error(
                'Audio recording has not been implemented yet.',
            );
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

            stopMediaTracks();
            revokeRecordingUrl();

            mediaRecorder = null;
            audioChunks = [];

            store.destroy();
            isDestroyed = true;
        },
    };
}