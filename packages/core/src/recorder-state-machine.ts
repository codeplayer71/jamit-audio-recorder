import type { RecorderState } from './types';

const ALLOWED_STATE_TRANSITIONS: Readonly<
    Record<RecorderState, readonly RecorderState[]>
> = {
    idle: [
        'requesting-permission',
        'error',
    ],
    'requesting-permission': [
        'recording',
        'idle',
        'error',
    ],
    recording: [
        'paused',
        'processing',
        'idle',
        'error',
    ],
    paused: [
        'recording',
        'processing',
        'idle',
        'error',
    ],
    processing: [
        'completed',
        'idle',
        'error',
    ],
    completed: [
        'idle',
        'requesting-permission',
        'error',
    ],
    error: [
        'idle',
        'requesting-permission',
    ],
};

export function canTransitionRecorderState(
    currentState: RecorderState,
    nextState: RecorderState,
): boolean {
    return ALLOWED_STATE_TRANSITIONS[currentState].includes(nextState);
}