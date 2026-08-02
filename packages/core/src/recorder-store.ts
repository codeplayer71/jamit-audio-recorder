import { canTransitionRecorderState } from './recorder-state-machine';
import type {
    AudioRecorderError,
    AudioRecording,
    RecorderSnapshot,
    RecorderState,
} from './types';

export type RecorderSubscriber = (
    snapshot: RecorderSnapshot,
) => void;

type RecorderSnapshotUpdate = Partial<{
    durationMs: number;
    recording: AudioRecording | null;
    error: AudioRecorderError | null;
}>;

export type RecorderStore = {
    getSnapshot: () => RecorderSnapshot;
    subscribe: (subscriber: RecorderSubscriber) => () => void;
    transition: (
        nextState: RecorderState,
        update?: RecorderSnapshotUpdate,
    ) => RecorderSnapshot;
    update: (
        update: RecorderSnapshotUpdate,
    ) => RecorderSnapshot;
    destroy: () => void;
};

const INITIAL_SNAPSHOT: RecorderSnapshot = Object.freeze({
    state: 'idle',
    durationMs: 0,
    recording: null,
    error: null,
});

export function createRecorderStore(): RecorderStore {
    let snapshot = INITIAL_SNAPSHOT;
    let isDestroyed = false;

    const subscribers = new Set<RecorderSubscriber>();

    function assertNotDestroyed(): void {
        if (isDestroyed) {
            throw new Error('Recorder store has been destroyed.');
        }
    }

    function publish(
        nextSnapshot: RecorderSnapshot,
    ): RecorderSnapshot {
        snapshot = Object.freeze(nextSnapshot);

        for (const subscriber of subscribers) {
            subscriber(snapshot);
        }

        return snapshot;
    }

    return {
        getSnapshot(): RecorderSnapshot {
            return snapshot;
        },

        subscribe(subscriber): () => void {
            assertNotDestroyed();

            subscribers.add(subscriber);

            return () => {
                subscribers.delete(subscriber);
            };
        },

        transition(nextState, update = {}): RecorderSnapshot {
            assertNotDestroyed();

            if (!canTransitionRecorderState(snapshot.state, nextState)) {
                throw new Error(
                    `Invalid recorder state transition: ${snapshot.state} -> ${nextState}.`,
                );
            }

            return publish({
                ...snapshot,
                ...update,
                state: nextState,
            });
        },

        update(update): RecorderSnapshot {
            assertNotDestroyed();

            return publish({
                ...snapshot,
                ...update,
            });
        },

        destroy(): void {
            if (isDestroyed) {
                return;
            }

            subscribers.clear();
            isDestroyed = true;
        },
    };
}