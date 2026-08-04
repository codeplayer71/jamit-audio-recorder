import type { RecorderSnapshot } from '@jamit/audio-recorder-core';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioRecorder } from './use-audio-recorder';

const recorderMock = vi.hoisted(() => ({
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    cancel: vi.fn(),
    reset: vi.fn(),
    destroy: vi.fn(),
    getSnapshot: vi.fn(),
    subscribe: vi.fn(),
}));

vi.mock('@jamit/audio-recorder-core', () => ({
    createAudioRecorder: vi.fn(() => recorderMock),
}));

describe('useAudioRecorder', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        recorderMock.getSnapshot.mockReturnValue({
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        } satisfies RecorderSnapshot);

        recorderMock.subscribe.mockImplementation(() => {
            return vi.fn();
        });
    });

    it('returns the initial recorder snapshot', () => {
        const { result } = renderHook(() => useAudioRecorder());

        expect(result.current.snapshot).toEqual({
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        });
    });

    it('forwards all recorder actions to the core recorder', async () => {
        recorderMock.start.mockResolvedValue(undefined);
        recorderMock.stop.mockResolvedValue(undefined);

        const { result } = renderHook(() => useAudioRecorder());

        await act(async () => {
            await result.current.start();
            result.current.pause();
            result.current.resume();
            await result.current.stop();
            result.current.cancel();
            result.current.reset();
        });

        expect(recorderMock.start).toHaveBeenCalledOnce();
        expect(recorderMock.pause).toHaveBeenCalledOnce();
        expect(recorderMock.resume).toHaveBeenCalledOnce();
        expect(recorderMock.stop).toHaveBeenCalledOnce();
        expect(recorderMock.cancel).toHaveBeenCalledOnce();
        expect(recorderMock.reset).toHaveBeenCalledOnce();
    });

    it('updates the snapshot when the recorder state changes', () => {
        let listener: (() => void) | undefined;

        let currentSnapshot: RecorderSnapshot = {
            state: 'idle',
            durationMs: 0,
            recording: null,
            error: null,
        };

        recorderMock.getSnapshot.mockImplementation(() => currentSnapshot);

        recorderMock.subscribe.mockImplementation((nextListener) => {
            listener = nextListener;

            return vi.fn();
        });

        const { result } = renderHook(() => useAudioRecorder());

        expect(result.current.snapshot.state).toBe('idle');

        act(() => {
            currentSnapshot = {
                state: 'recording',
                durationMs: 1_500,
                recording: null,
                error: null,
            };

            listener?.();
        });

        expect(result.current.snapshot).toEqual({
            state: 'recording',
            durationMs: 1_500,
            recording: null,
            error: null,
        });
    });

    it('destroys the recorder when the hook unmounts', () => {
        vi.useFakeTimers();

        const { unmount } = renderHook(() => useAudioRecorder());

        unmount();

        expect(recorderMock.destroy).not.toHaveBeenCalled();

        act(() => {
            vi.runAllTimers();
        });

        expect(recorderMock.destroy).toHaveBeenCalledOnce();

        vi.useRealTimers();
    });

    it('destroys the recorder only once when destroy is called manually', () => {
        vi.useFakeTimers();

        const { result, unmount } = renderHook(() => useAudioRecorder());

        act(() => {
            result.current.destroy();
        });

        expect(recorderMock.destroy).toHaveBeenCalledOnce();

        unmount();

        act(() => {
            vi.runAllTimers();
        });

        expect(recorderMock.destroy).toHaveBeenCalledOnce();

        vi.useRealTimers();
    });
});