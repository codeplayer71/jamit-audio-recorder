import {
    createAudioRecorder,
    type RecorderSnapshot,
} from '@codeplayer71/audio-recorder-core';
import {
    useCallback,
    useEffect,
    useRef,
    useSyncExternalStore,
} from 'react';

type CoreRecorder = ReturnType<typeof createAudioRecorder>;

export type UseAudioRecorderOptions = Parameters<
    typeof createAudioRecorder
>[0];

export type UseAudioRecorderReturn = {
    snapshot: RecorderSnapshot;
    audioLevel: number;
    start: CoreRecorder['start'];
    pause: CoreRecorder['pause'];
    resume: CoreRecorder['resume'];
    stop: CoreRecorder['stop'];
    cancel: CoreRecorder['cancel'];
    reset: CoreRecorder['reset'];
    destroy: CoreRecorder['destroy'];
};

export function useAudioRecorder(
    options?: UseAudioRecorderOptions,
): UseAudioRecorderReturn {
    const recorderRef = useRef<CoreRecorder | null>(null);

    if (recorderRef.current === null) {
        recorderRef.current = createAudioRecorder(options);
    }

    const recorder = recorderRef.current;

    const snapshot = useSyncExternalStore(
        recorder.subscribe,
        recorder.getSnapshot,
        recorder.getSnapshot,
    );

    const isMountedRef = useRef(false);
    const isDestroyedRef = useRef(false);
    const destroyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const destroy = useCallback(() => {
        if (isDestroyedRef.current) {
            return;
        }

        isDestroyedRef.current = true;
        recorder.destroy();
    }, [recorder]);

    useEffect(() => {
        isMountedRef.current = true;

        if (destroyTimeoutRef.current !== null) {
            clearTimeout(destroyTimeoutRef.current);
            destroyTimeoutRef.current = null;
        }

        return () => {
            isMountedRef.current = false;

            destroyTimeoutRef.current = setTimeout(() => {
                if (!isMountedRef.current) {
                    destroy();
                }
            }, 0);
        };
    }, [destroy]);

    return {
        snapshot,
        audioLevel: snapshot.audioLevel,
        start: recorder.start,
        pause: recorder.pause,
        resume: recorder.resume,
        stop: recorder.stop,
        cancel: recorder.cancel,
        reset: recorder.reset,
        destroy,
    };
}