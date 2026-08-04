import { effectScope } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioRecorder } from './use-audio-recorder';
import type { RecorderSnapshot } from '@jamit/audio-recorder-core';

const unsubscribeMock = vi.fn();

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
        });

        recorderMock.subscribe.mockReturnValue(unsubscribeMock);
    });

    it('subscribes to the recorder and cleans it up with the Vue scope', () => {
        const scope = effectScope();

        const result = scope.run(() => useAudioRecorder());

        expect(result?.snapshot.value.state).toBe('idle');
        expect(recorderMock.subscribe).toHaveBeenCalledOnce();

        scope.stop();

        expect(unsubscribeMock).toHaveBeenCalledOnce();
        expect(recorderMock.destroy).toHaveBeenCalledOnce();
    });

    it('updates the snapshot when the recorder emits a new state', () => {
        let listener: ((snapshot: RecorderSnapshot) => void) | undefined;

        recorderMock.subscribe.mockImplementation((nextListener) => {
            listener = nextListener;

            return unsubscribeMock;
        });

        const scope = effectScope();

        const result = scope.run(() => useAudioRecorder());

        listener?.({
            state: 'recording',
            durationMs: 1_500,
            recording: null,
            error: null,
        });

        expect(result?.snapshot.value).toEqual({
            state: 'recording',
            durationMs: 1_500,
            recording: null,
            error: null,
        });

        scope.stop();
    });

    it('forwards all recorder actions to the core recorder', async () => {
        recorderMock.start.mockResolvedValue(undefined);
        recorderMock.stop.mockResolvedValue(undefined);

        const scope = effectScope();

        const result = scope.run(() => useAudioRecorder());

        await result?.start();
        result?.pause();
        result?.resume();
        await result?.stop();
        result?.cancel();
        result?.reset();

        expect(recorderMock.start).toHaveBeenCalledOnce();
        expect(recorderMock.pause).toHaveBeenCalledOnce();
        expect(recorderMock.resume).toHaveBeenCalledOnce();
        expect(recorderMock.stop).toHaveBeenCalledOnce();
        expect(recorderMock.cancel).toHaveBeenCalledOnce();
        expect(recorderMock.reset).toHaveBeenCalledOnce();

        scope.stop();
    });

    it('cleans up only once when destroy is called manually', () => {
        const scope = effectScope();

        const result = scope.run(() => useAudioRecorder());

        result?.destroy();
        scope.stop();

        expect(unsubscribeMock).toHaveBeenCalledOnce();
        expect(recorderMock.destroy).toHaveBeenCalledOnce();
    });
});