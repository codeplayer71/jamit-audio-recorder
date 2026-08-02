import { describe, expect, it, vi } from 'vitest';

import { createAudioRecorder } from './index';

describe('createAudioRecorder', () => {
    it('starts with an idle snapshot', () => {
        const recorder = createAudioRecorder();

        expect(recorder.getSnapshot()).toEqual({
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        });
    });

    it('reports an unsupported environment when start is called', async () => {
        const recorder = createAudioRecorder({
            environment: {},
        });

        await expect(recorder.start()).rejects.toMatchObject({
            code: 'unsupported-browser',
        });

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'unsupported-browser',
            },
        });
    });

    it('notifies subscribers about an unsupported environment', async () => {
        const recorder = createAudioRecorder({
            environment: {},
        });

        const subscriber = vi.fn();

        recorder.subscribe(subscriber);

        await expect(recorder.start()).rejects.toBeDefined();

        expect(subscriber).toHaveBeenCalledTimes(1);
        expect(subscriber).toHaveBeenCalledWith(
            recorder.getSnapshot(),
        );
    });

    it('can reset after an error', async () => {
        const recorder = createAudioRecorder({
            environment: {},
        });

        await expect(recorder.start()).rejects.toBeDefined();

        recorder.reset();

        expect(recorder.getSnapshot()).toEqual({
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        });
    });

    it('rejects reset while idle', () => {
        const recorder = createAudioRecorder();

        expect(() => recorder.reset()).toThrow(
            'Cannot reset the recorder while it is in the "idle" state.',
        );
    });

    it('prevents actions after destroy', async () => {
        const recorder = createAudioRecorder();

        recorder.destroy();

        await expect(recorder.start()).rejects.toThrow(
            'Audio recorder has been destroyed.',
        );
    });

    it('can be destroyed multiple times', () => {
        const recorder = createAudioRecorder();

        expect(() => {
            recorder.destroy();
            recorder.destroy();
        }).not.toThrow();
    });

    it('requests microphone access and starts recording', async () => {
        const stopTrack = vi.fn();

        const mediaStream = {
            getTracks: () => [
                {
                    stop: stopTrack,
                },
            ],
        } as unknown as MediaStream;

        const getUserMedia = vi.fn().mockResolvedValue(
            mediaStream,
        );

        const start = vi.fn();

        class MediaRecorderMock {
            static isTypeSupported(mimeType: string): boolean {
                return mimeType === 'audio/mp4';
            }

            start = start;
        }

        const recorder = createAudioRecorder({
            preferredMimeTypes: [
                'audio/webm;codecs=opus',
                'audio/mp4',
            ],
            audioConstraints: {
                channelCount: 1,
            },
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia,
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();

        expect(getUserMedia).toHaveBeenCalledWith({
            audio: {
                channelCount: 1,
            },
        });

        expect(start).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'recording',
            durationMs: 0,
            recording: null,
            error: null,
        });
    });

    it('maps microphone access errors', async () => {
        const getUserMedia = vi.fn().mockRejectedValue(
            new DOMException(
                'Permission denied',
                'NotAllowedError',
            ),
        );

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia,
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await expect(recorder.start()).rejects.toMatchObject({
            code: 'permission-denied',
        });

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'permission-denied',
            },
        });
    });

    it('rejects unsupported preferred MIME types', async () => {
        const stopTrack = vi.fn();

        const mediaStream = {
            getTracks: () => [
                {
                    stop: stopTrack,
                },
            ],
        } as unknown as MediaStream;

        const getUserMedia = vi.fn().mockResolvedValue(
            mediaStream,
        );

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return false;
            }
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia,
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await expect(recorder.start()).rejects.toMatchObject({
            code: 'unsupported-mime-type',
        });

        expect(stopTrack).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'unsupported-mime-type',
            },
        });
    });

    it('rejects starting more than once', async () => {
        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        const getUserMedia = vi.fn().mockResolvedValue(
            mediaStream,
        );

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            start(): void {}
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia,
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();

        await expect(recorder.start()).rejects.toMatchObject({
            code: 'invalid-state',
        });

        expect(getUserMedia).toHaveBeenCalledTimes(1);
    });

    it('pauses an active recording', async () => {
        const pause = vi.fn();

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            start(): void {}

            pause = pause;
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockResolvedValue(
                            mediaStream,
                        ),
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();
        recorder.pause();

        expect(pause).toHaveBeenCalledTimes(1);
        expect(recorder.getSnapshot().state).toBe('paused');
    });

    it('resumes a paused recording', async () => {
        const resume = vi.fn();

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            start(): void {}

            pause(): void {}

            resume = resume;
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockResolvedValue(
                            mediaStream,
                        ),
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();
        recorder.pause();
        recorder.resume();

        expect(resume).toHaveBeenCalledTimes(1);
        expect(recorder.getSnapshot().state).toBe('recording');
    });

    it('rejects pausing while idle', () => {
        const recorder = createAudioRecorder();

        expect(() => recorder.pause()).toThrow(
            'Expected recorder state "recording", but received "idle".',
        );
    });

    it('rejects resuming while recording', async () => {
        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            start(): void {}
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockResolvedValue(
                            mediaStream,
                        ),
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();

        expect(() => recorder.resume()).toThrow(
            'Expected recorder state "paused", but received "recording".',
        );
    });

    it('maps errors thrown while pausing', async () => {
        const pauseError = new Error('Pause failed');

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            start(): void {}

            pause(): void {
                throw pauseError;
            }
        }

        const recorder = createAudioRecorder({
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockResolvedValue(
                            mediaStream,
                        ),
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();

        expect(() => recorder.pause()).toThrow(
            'The audio recording could not be paused.',
        );

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'recording-failed',
                originalError: pauseError,
            },
        });
    });

    it('stops recording and creates an audio result', async () => {
        const stopTrack = vi.fn();

        const mediaStream = {
            getTracks: () => [
                {
                    stop: stopTrack,
                },
            ],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            mimeType = 'audio/webm;codecs=opus';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                this.ondataavailable?.({
                    data: new Blob(['audio-data'], {
                        type: this.mimeType,
                    }),
                } as BlobEvent);

                this.onstop?.();
            }
        }

        const recorder = createAudioRecorder({
            fileName: 'voice-message',
            environment: {
                navigator: {
                    mediaDevices: {
                        getUserMedia: vi.fn().mockResolvedValue(
                            mediaStream,
                        ),
                    } as unknown as MediaDevices,
                },
                MediaRecorder:
                    MediaRecorderMock as unknown as typeof MediaRecorder,
            },
        });

        await recorder.start();

        const recording = await recorder.stop();

        expect(recording.file.name).toBe(
            'voice-message.webm',
        );
        expect(recording.mimeType).toBe(
            'audio/webm;codecs=opus',
        );
        expect(recording.extension).toBe('webm');
        expect(recording.sizeBytes).toBeGreaterThan(0);
        expect(recording.blob).toBeInstanceOf(Blob);
        expect(recording.file).toBeInstanceOf(File);
        expect(recording.createdAt).toBeInstanceOf(Date);

        expect(stopTrack).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'completed',
            recording,
            error: null,
        });
    });
});