import {
    cleanup,
    render,
    screen,
} from '@testing-library/react';

import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';

import { JamItAudioRecorder } from './JamItAudioRecorder';
import type { RecorderSnapshot } from '@codeplayer71/audio-recorder-core';
import { useAudioRecorder } from '../use-audio-recorder';

const recorderMock = vi.hoisted(() => ({
    snapshot: {
        state: 'idle',
        durationMs: 0,
        recording: null,
        error: null,
        audioLevel: 0,
    } as RecorderSnapshot,
    audioLevel: 0,
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

        recorderMock.snapshot = {
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
            audioLevel: 0
        };
    });

    it('renders the default recorder interface', () => {
        render(<JamItAudioRecorder />);

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

    it('supports custom labels and hidden sections', () => {
        render(
            <JamItAudioRecorder
                title="Voice message"
                startLabel="Record"
                showStatus={false}
                showDuration={false}
                showDownload={false}
                showCancel={false}
                showReset={false}
            />,
        );

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

    it('renders custom content through render props', () => {
        render(
            <JamItAudioRecorder
                renderHeader={() => <div>Custom header</div>}
                renderControls={() => <div>Custom controls</div>}
                renderFooter={() => <div>Custom footer</div>}
            />,
        );

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

    it('forwards button clicks to the recorder actions', () => {
        recorderMock.snapshot = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0,
        };

        render(<JamItAudioRecorder />);

        screen.getByRole('button', {
            name: 'Pause',
        }).click();

        screen.getByRole('button', {
            name: 'Stop',
        }).click();

        screen.getByRole('button', {
            name: 'Cancel',
        }).click();

        expect(recorderMock.pause).toHaveBeenCalledOnce();
        expect(recorderMock.stop).toHaveBeenCalledOnce();
        expect(recorderMock.cancel).toHaveBeenCalledOnce();
    });

    it('starts a recording from the idle state', () => {
        render(<JamItAudioRecorder />);

        screen.getByRole('button', {
            name: 'Start recording',
        }).click();

        expect(recorderMock.start).toHaveBeenCalledOnce();
    });

    it('renders the completed recording with player and download', () => {
        recorderMock.snapshot = {
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
                createdAt: new Date('2026-08-05T06:00:00.000Z'),
            },
            error: null,
            audioLevel: 0,
        };

        render(<JamItAudioRecorder />);

        const audioElement = document.querySelector(
            '.jamit-audio-recorder__player',
        );

        const downloadLink = screen
            .getByText('Download recording')
            .closest('a');

        const resetButton = screen.getByRole('button', {
            name: 'Reset',
        });

        if (!(audioElement instanceof HTMLAudioElement)) {
            throw new Error('Audio player was not rendered.');
        }

        if (downloadLink === null) {
            throw new Error('Download link was not rendered.');
        }

        expect(audioElement.getAttribute('src')).toBe(
            'blob:recording-url',
        );

        expect(downloadLink.getAttribute('href')).toBe(
            'blob:recording-url',
        );

        expect(downloadLink.getAttribute('download')).toBe(
            'recording.webm',
        );

        expect(downloadLink.getAttribute('aria-disabled')).toBe(
            'false',
        );

        expect(resetButton).toBeInstanceOf(HTMLButtonElement);
        expect((resetButton as HTMLButtonElement).disabled).toBe(false);
    });

    it('renders recorder errors as an alert', () => {
        recorderMock.snapshot = {
            state: 'error',
            durationMs: 0,
            recording: null,
            error: {
                code: 'permission-denied',
                message: 'Microphone permission was denied.',
            },
            audioLevel: 0,
        };

        render(<JamItAudioRecorder />);

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

    it('resets a completed recording', () => {
        recorderMock.snapshot = {
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
                createdAt: new Date('2026-08-05T06:00:00.000Z'),
            },
            error: null,
            audioLevel: 0,
        };

        render(<JamItAudioRecorder />);

        screen.getByRole('button', {
            name: 'Reset',
        }).click();

        expect(recorderMock.reset).toHaveBeenCalledOnce();
    });

    it('passes recorder options to the hook', () => {
        const audioConstraints = {
            channelCount: 2,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
        };

        render(
            <JamItAudioRecorder
                maxDurationMs={30_000}
                maxFileSizeBytes={2_000_000}
                audioConstraints={audioConstraints}
            />,
        );

        expect(vi.mocked(useAudioRecorder)).toHaveBeenCalledWith({
            maxDurationMs: 30_000,
            maxFileSizeBytes: 2_000_000,
            audioConstraints,
        });
    });

    it('renders the current audio level while recording', () => {
        recorderMock.snapshot = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0.42,
        };

        recorderMock.audioLevel = 0.42;

        render(<JamItAudioRecorder />);

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

    it('hides the audio level when disabled', () => {
        recorderMock.snapshot = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0.42,
        };

        recorderMock.audioLevel = 0.42;

        render(
            <JamItAudioRecorder
                showAudioLevel={false}
            />,
        );

        expect(
            screen.queryByRole('meter', {
                name: 'Audio input level',
            }),
        ).toBeNull();
    });

    it('shows a zero audio level while paused', () => {
        recorderMock.snapshot = {
            state: 'paused',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0,
        };

        recorderMock.audioLevel = 0;

        render(<JamItAudioRecorder />);

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

    it('provides the current audio level to the custom renderer', () => {
        recorderMock.snapshot = {
            state: 'recording',
            durationMs: 1_000,
            recording: null,
            error: null,
            audioLevel: 0.42,
        };

        recorderMock.audioLevel = 0.42;

        render(
            <JamItAudioRecorder
                renderAudioLevel={({ audioLevel }) => (
                    <div data-testid="custom-audio-level">
                        {audioLevel}
                    </div>
                )}
            />,
        );

        expect(
            screen.getByTestId('custom-audio-level').textContent,
        ).toBe('0.42');

        expect(
            screen.queryByRole('meter', {
                name: 'Audio input level',
            }),
        ).toBeNull();
    });
});