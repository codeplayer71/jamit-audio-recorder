import {
    cleanup,
    render,
    screen,
} from '@testing-library/vue';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import JamItAudioRecorder from './JamItAudioRecorder.vue';
import type { RecorderSnapshot } from '@codeplayer71/audio-recorder-core';
import { useAudioRecorder } from '../use-audio-recorder';

const recorderMock = vi.hoisted(() => ({
    snapshot: {
        __v_isRef: true as const,
        value: {
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        } as RecorderSnapshot,
    },
    audioLevel: {
        __v_isRef: true as const,
        value: 0,
    },
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    destroy: vi.fn(),
}));

vi.mock('../use-audio-recorder', () => ({
    useAudioRecorder: vi.fn(() => recorderMock),
}));

afterEach(() => {
    cleanup();
});

describe('JamItAudioRecorder', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        recorderMock.snapshot.value = {
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
            audioLevel: 0,
        };
    });

    it('renders the default recorder interface', () => {
        render(JamItAudioRecorder);

        expect(
            screen.getByRole('heading', {
                name: 'Audio Recorder',
            }),
        ).toBeTruthy();

        const startButton = screen.getByRole('button', {
            name: 'Start recording',
        });

        const pauseButton = screen.getByRole('button', {
            name: 'Pause',
        });

        const downloadLink = screen
            .getByText('Download recording')
            .closest('a');

        if (downloadLink === null) {
            throw new Error('Download link was not rendered.');
        }

        expect(startButton).toBeInstanceOf(HTMLButtonElement);
        expect(pauseButton).toBeInstanceOf(HTMLButtonElement);

        expect((startButton as HTMLButtonElement).disabled).toBe(false);
        expect((pauseButton as HTMLButtonElement).disabled).toBe(true);
        expect(downloadLink.getAttribute('aria-disabled')).toBe('true');
    });

    it('renders the current audio level while recording', () => {
        recorderMock.snapshot.value = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0.42,
        };

        recorderMock.audioLevel.value = 0.42;

        render(JamItAudioRecorder);

        const meter = screen.getByRole('meter', {
            name: 'Audio input level',
        });

        expect(meter.getAttribute('aria-valuemin')).toBe('0');
        expect(meter.getAttribute('aria-valuemax')).toBe('100');
        expect(meter.getAttribute('aria-valuenow')).toBe('42');

        const levelValue = meter.querySelector(
            '.jamit-audio-recorder__audio-level-value',
        );

        if (levelValue === null) {
            throw new Error('Audio level value was not rendered.');
        }

        expect(
            (levelValue as HTMLElement).style.transform,
        ).toBe('scaleX(0.42)');
    });

    it('supports custom labels and hidden sections', () => {
        render(JamItAudioRecorder, {
            props: {
                title: 'Voice message',
                startLabel: 'Record',
                showStatus: false,
                showDuration: false,
                showDownload: false,
                showCancel: false,
                showReset: false,
            },
        });

        expect(
            screen.getByRole('heading', {
                name: 'Voice message',
            }),
        ).toBeTruthy();

        expect(
            screen.getByRole('button', {
                name: 'Record',
            }),
        ).toBeTruthy();

        expect(screen.queryByText('Status')).toBeNull();
        expect(screen.queryByText('Duration')).toBeNull();
        expect(screen.queryByText('Download recording')).toBeNull();

        expect(
            screen.queryByRole('button', {
                name: 'Cancel',
            }),
        ).toBeNull();

        expect(
            screen.queryByRole('button', {
                name: 'Reset',
            }),
        ).toBeNull();
    });

    it('renders custom content through named slots', () => {
        render(JamItAudioRecorder, {
            slots: {
                header: '<div>Custom header</div>',
                controls: '<div>Custom controls</div>',
                footer: '<div>Custom footer</div>',
            },
        });

        expect(screen.getByText('Custom header')).toBeTruthy();
        expect(screen.getByText('Custom controls')).toBeTruthy();
        expect(screen.getByText('Custom footer')).toBeTruthy();

        expect(
            screen.queryByRole('heading', {
                name: 'Audio Recorder',
            }),
        ).toBeNull();

        expect(
            screen.queryByRole('button', {
                name: 'Start recording',
            }),
        ).toBeNull();
    });

    it('forwards button clicks to the recorder actions', async () => {
        recorderMock.snapshot.value = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0,
        };

        render(JamItAudioRecorder);

        await screen.getByRole('button', {
            name: 'Pause',
        }).click();

        await screen.getByRole('button', {
            name: 'Stop',
        }).click();

        await screen.getByRole('button', {
            name: 'Cancel',
        }).click();

        expect(recorderMock.pause).toHaveBeenCalledOnce();
        expect(recorderMock.stop).toHaveBeenCalledOnce();
        expect(recorderMock.cancel).toHaveBeenCalledOnce();
    });

    it('starts a recording from the idle state', async () => {
        render(JamItAudioRecorder);

        await screen.getByRole('button', {
            name: 'Start recording',
        }).click();

        expect(recorderMock.start).toHaveBeenCalledOnce();
    });

    it('renders the completed recording with player and download', () => {
        recorderMock.snapshot.value = {
            state: 'completed',
            durationMs: 5_000,
            recording: {
                blob: new Blob(['audio'], {
                    type: 'audio/webm',
                }),
                file: new File(['audio'], 'recording.webm', {
                    type: 'audio/webm',
                }),
                url: 'blob:recording-url',
                durationMs: 5_000,
                mimeType: 'audio/webm',
                sizeBytes: 5,
                extension: 'webm',
                createdAt: new Date('2026-08-04T12:00:00.000Z'),
            },
            error: null,
            audioLevel: 0,
        };

        // ...
    });

    it('renders recorder errors as an alert', () => {
        recorderMock.snapshot.value = {
            state: 'error',
            durationMs: 0,
            recording: null,
            error: {
                code: 'permission-denied',
                message: 'Microphone permission was denied.',
            },
            audioLevel: 0,
        };

        render(JamItAudioRecorder);

        const alert = screen.getByRole('alert');

        expect(alert.textContent).toBe(
            'Microphone permission was denied.',
        );

        const resetButton = screen.getByRole('button', {
            name: 'Reset',
        });

        expect(resetButton).toBeInstanceOf(HTMLButtonElement);
        expect((resetButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('resets a completed recording', async () => {
        recorderMock.snapshot.value = {
            state: 'completed',
            durationMs: 5_000,
            recording: {
                blob: new Blob(['audio'], {
                    type: 'audio/webm',
                }),
                file: new File(['audio'], 'recording.webm', {
                    type: 'audio/webm',
                }),
                url: 'blob:recording-url',
                durationMs: 5_000,
                mimeType: 'audio/webm',
                sizeBytes: 5,
                extension: 'webm',
                createdAt: new Date('2026-08-04T12:00:00.000Z'),
            },
            error: null,
            audioLevel: 0,
        };

        render(JamItAudioRecorder);

        await screen.getByRole('button', {
            name: 'Reset',
        }).click();

        expect(recorderMock.reset).toHaveBeenCalledOnce();
    });

    it('passes recorder options to the composable', () => {
        const audioConstraints = {
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
        };

        render(JamItAudioRecorder, {
            props: {
                maxDurationMs: 30_000,
                maxFileSizeBytes: 2_000_000,
                audioConstraints,
            },
        });

        expect(vi.mocked(useAudioRecorder)).toHaveBeenCalledWith({
            maxDurationMs: 30_000,
            maxFileSizeBytes: 2_000_000,
            audioConstraints,
        });
    });

    it('hides the audio level when disabled', () => {
        recorderMock.snapshot.value = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0.42,
        };

        recorderMock.audioLevel.value = 0.42;

        render(JamItAudioRecorder, {
            props: {
                showAudioLevel: false,
            },
        });

        expect(
            screen.queryByRole('meter', {
                name: 'Audio input level',
            }),
        ).toBeNull();
    });

    it('shows a zero audio level while paused', () => {
        recorderMock.snapshot.value = {
            state: 'paused',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0,
        };

        recorderMock.audioLevel.value = 0;

        render(JamItAudioRecorder);

        const meter = screen.getByRole('meter', {
            name: 'Audio input level',
        });

        expect(meter.getAttribute('aria-valuenow')).toBe('0');

        const levelValue = meter.querySelector(
            '.jamit-audio-recorder__audio-level-value',
        );

        if (levelValue === null) {
            throw new Error('Audio level value was not rendered.');
        }

        expect(
            (levelValue as HTMLElement).style.transform,
        ).toBe('scaleX(0)');
    });

    it('provides the current audio level to the custom slot', () => {
        recorderMock.snapshot.value = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0.42,
        };

        recorderMock.audioLevel.value = 0.42;

        render(JamItAudioRecorder, {
            slots: {
                audioLevel: `
                <template #audioLevel="{ audioLevel }">
                    <div data-testid="custom-audio-level">
                        {{ audioLevel }}
                    </div>
                </template>
            `,
            },
        });

        expect(
            screen.getByTestId('custom-audio-level').textContent?.trim(),
        ).toBe('0.42');

        expect(
            screen.queryByRole('meter', {
                name: 'Audio input level',
            }),
        ).toBeNull();
    });
});