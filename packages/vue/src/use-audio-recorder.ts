import {
    createAudioRecorder,
    type RecorderSnapshot,
} from '@jamit/audio-recorder-core';
import {
    computed,
    onScopeDispose,
    shallowRef,
    type ComputedRef,
} from 'vue';

type CoreRecorder = ReturnType<typeof createAudioRecorder>;

export type UseAudioRecorderOptions = Parameters<
    typeof createAudioRecorder
>[0];

export type UseAudioRecorderReturn = {
    snapshot: ComputedRef<RecorderSnapshot>;
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
    const recorder = createAudioRecorder(options);
    const currentSnapshot = shallowRef<RecorderSnapshot>(
        recorder.getSnapshot(),
    );

    const unsubscribe = recorder.subscribe((nextSnapshot) => {
        currentSnapshot.value = nextSnapshot;
    });

    const snapshot = computed(() => currentSnapshot.value);

    let isDestroyed = false;

    function destroy(): void {
        if (isDestroyed) {
            return;
        }

        isDestroyed = true;

        unsubscribe();
        recorder.destroy();
    }

    onScopeDispose(() => {
        destroy();
    });

    return {
        snapshot,
        start: () => recorder.start(),
        pause: () => recorder.pause(),
        resume: () => recorder.resume(),
        stop: () => recorder.stop(),
        cancel: () => recorder.cancel(),
        reset: () => recorder.reset(),
        destroy,
    };
}