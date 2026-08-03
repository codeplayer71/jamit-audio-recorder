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
    it('measures recording duration without counting paused time', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-02T12:00:00Z'));

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            start(): void {}

            pause(): void {}

            resume(): void {}
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

        try {
            await recorder.start();

            vi.advanceTimersByTime(1_500);

            expect(
                recorder.getSnapshot().durationMs,
            ).toBe(1_500);

            recorder.pause();

            vi.advanceTimersByTime(1_000);

            expect(
                recorder.getSnapshot().durationMs,
            ).toBe(1_500);

            recorder.resume();

            vi.advanceTimersByTime(500);

            expect(
                recorder.getSnapshot().durationMs,
            ).toBe(2_000);
        } finally {
            recorder.destroy();
            vi.useRealTimers();
        }
    });

    it('cancels an active recording and discards its data', async () => {
        const stopRecorder = vi.fn();
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

            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop = stopRecorder;
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
        recorder.cancel();

        expect(stopRecorder).toHaveBeenCalledTimes(1);
        expect(stopTrack).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toEqual({
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        });
    });

    it('cancels a paused recording', async () => {
        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            pause(): void {}

            stop(): void {}
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
        recorder.cancel();

        expect(recorder.getSnapshot().state).toBe('idle');
    });

    it('rejects cancelling while idle', () => {
        const recorder = createAudioRecorder();

        expect(() => recorder.cancel()).toThrow(
            'Expected recorder state to be one of "recording", "paused", but received "idle".',
        );
    });

    it('maps errors thrown while cancelling', async () => {
        const cancelError = new Error('Cancel failed');

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                throw cancelError;
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

        expect(() => recorder.cancel()).toThrow(
            'The audio recording could not be cancelled.',
        );

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'recording-failed',
                originalError: cancelError,
            },
        });
    });

    it('stops automatically when the maximum duration is reached', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-02T12:00:00Z'));

        const stopRecorder = vi.fn();

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                stopRecorder();

                this.ondataavailable?.({
                    data: new Blob(['audio-data']),
                } as BlobEvent);

                this.onstop?.();
            }
        }

        const recorder = createAudioRecorder({
            maxDurationMs: 1_000,
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

        try {
            await recorder.start();

            await vi.advanceTimersByTimeAsync(1_000);

            expect(stopRecorder).toHaveBeenCalledTimes(1);

            expect(recorder.getSnapshot()).toMatchObject({
                state: 'error',
                recording: null,
                error: {
                    code: 'max-duration-exceeded',
                },
            });

            expect(recorder.getSnapshot().durationMs).toBe(1_000);
        } finally {
            recorder.destroy();
            vi.useRealTimers();
        }
    });

    it('stops automatically when the maximum file size is exceeded', async () => {
        const stopRecorder = vi.fn();

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {
                queueMicrotask(() => {
                    this.ondataavailable?.({
                        data: new Blob(['audio-data']),
                    } as BlobEvent);
                });
            }

            stop(): void {
                stopRecorder();
                this.onstop?.();
            }
        }

        const recorder = createAudioRecorder({
            maxFileSizeBytes: 5,
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

        await expect(recorder.start()).resolves.toBeUndefined();

        await vi.waitFor(() => {
            expect(stopRecorder).toHaveBeenCalledTimes(1);
        });

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            recording: null,
            error: {
                code: 'max-file-size-exceeded',
            },
        });
    });

    it('allows a recording that exactly matches the maximum file size', async () => {
        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                this.ondataavailable?.({
                    data: new Blob(['12345']),
                } as BlobEvent);

                this.onstop?.();
            }
        }

        const recorder = createAudioRecorder({
            maxFileSizeBytes: 5,
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

        expect(recording.sizeBytes).toBe(5);
        expect(recorder.getSnapshot().state).toBe('completed');
    });

    it('stops an active MediaRecorder when destroyed', async () => {
        const stopRecorder = vi.fn();

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            state: RecordingState = 'recording';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                stopRecorder();
                this.state = 'inactive';
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
        recorder.destroy();

        expect(stopRecorder).toHaveBeenCalledTimes(1);
    });

    it('continues cleanup when stopping MediaRecorder during destroy fails', async () => {
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

            state: RecordingState = 'recording';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                throw new Error('Stop failed');
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

        expect(() => recorder.destroy()).not.toThrow();
        expect(stopTrack).toHaveBeenCalledTimes(1);

        await expect(recorder.start()).rejects.toThrow(
            'Audio recorder has been destroyed.',
        );
    });

    it('cleans up resources when pausing fails', async () => {
        const stopTrack = vi.fn();
        const pauseError = new Error('Pause failed');

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

        expect(stopTrack).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'recording-failed',
                originalError: pauseError,
            },
        });
    });

    it('cleans up resources when resuming fails', async () => {
        const stopTrack = vi.fn();
        const resumeError = new Error('Resume failed');

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

            start(): void {}

            pause(): void {}

            resume(): void {
                throw resumeError;
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
        recorder.pause();

        expect(() => recorder.resume()).toThrow(
            'The audio recording could not be resumed.',
        );

        expect(stopTrack).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'recording-failed',
                originalError: resumeError,
            },
        });
    });

    it('cleans up resources when starting MediaRecorder fails', async () => {
        const stopTrack = vi.fn();
        const startError = new Error('Start failed');

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

            start(): void {
                throw startError;
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

        await expect(recorder.start()).rejects.toMatchObject({
            code: 'recording-failed',
            originalError: startError,
        });

        expect(stopTrack).toHaveBeenCalledTimes(1);

        expect(recorder.getSnapshot()).toMatchObject({
            state: 'error',
            error: {
                code: 'recording-failed',
                originalError: startError,
            },
        });
    });

    it('does not count paused time toward the maximum duration', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-08-03T05:00:00Z'));

        const stopRecorder = vi.fn();

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            state: RecordingState = 'inactive';
            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {
                this.state = 'recording';
            }

            pause(): void {
                this.state = 'paused';
            }

            resume(): void {
                this.state = 'recording';
            }

            stop(): void {
                stopRecorder();
                this.state = 'inactive';
                this.onstop?.();
            }
        }

        const recorder = createAudioRecorder({
            maxDurationMs: 1_000,
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

        try {
            await recorder.start();

            await vi.advanceTimersByTimeAsync(600);

            recorder.pause();

            await vi.advanceTimersByTimeAsync(2_000);

            expect(stopRecorder).not.toHaveBeenCalled();

            recorder.resume();

            await vi.advanceTimersByTimeAsync(400);

            expect(stopRecorder).toHaveBeenCalledTimes(1);

            expect(recorder.getSnapshot()).toMatchObject({
                state: 'error',
                error: {
                    code: 'max-duration-exceeded',
                },
            });
        } finally {
            recorder.destroy();
            vi.useRealTimers();
        }
    });

    it('revokes the recording URL when reset', async () => {
        const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                this.ondataavailable?.({
                    data: new Blob(['audio-data']),
                } as BlobEvent);

                this.onstop?.();
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

        try {
            await recorder.start();

            const recording = await recorder.stop();

            recorder.reset();

            expect(revokeObjectURL).toHaveBeenCalledWith(
                recording.url,
            );

            expect(recorder.getSnapshot()).toEqual({
                state: 'idle',
                durationMs: 0,
                recording: null,
                error: null,
            });
        } finally {
            recorder.destroy();
            revokeObjectURL.mockRestore();
        }
    });

    it('revokes the recording URL when destroyed', async () => {
        const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');

        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            state: RecordingState = 'inactive';
            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {
                this.state = 'recording';
            }

            stop(): void {
                this.state = 'inactive';

                this.ondataavailable?.({
                    data: new Blob(['audio-data']),
                } as BlobEvent);

                this.onstop?.();
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

        try {
            await recorder.start();

            const recording = await recorder.stop();

            recorder.destroy();

            expect(revokeObjectURL).toHaveBeenCalledWith(
                recording.url,
            );
        } finally {
            revokeObjectURL.mockRestore();
        }
    });

    it('can start a new recording after reset', async () => {
        const mediaStream = {
            getTracks: () => [],
        } as unknown as MediaStream;

        class MediaRecorderMock {
            static isTypeSupported(): boolean {
                return true;
            }

            mimeType = 'audio/webm';
            ondataavailable: ((event: BlobEvent) => void) | null =
                null;
            onstop: (() => void) | null = null;
            onerror: ((event: Event) => void) | null = null;

            start(): void {}

            stop(): void {
                this.ondataavailable?.({
                    data: new Blob(['audio-data']),
                } as BlobEvent);

                this.onstop?.();
            }
        }

        const getUserMedia = vi.fn().mockResolvedValue(
            mediaStream,
        );

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
        await recorder.stop();

        recorder.reset();

        await recorder.start();

        expect(getUserMedia).toHaveBeenCalledTimes(2);
        expect(recorder.getSnapshot()).toMatchObject({
            state: 'recording',
            recording: null,
            error: null,
        });

        recorder.destroy();
    });
});