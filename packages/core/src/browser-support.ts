export type AudioRecorderBrowserSupport = Readonly<{
    isBrowser: boolean;
    hasMediaDevices: boolean;
    hasGetUserMedia: boolean;
    hasMediaRecorder: boolean;
    isSupported: boolean;
}>;

export type AudioRecorderBrowserEnvironment = {
    navigator?: Pick<Navigator, 'mediaDevices'>;
    MediaRecorder?: typeof MediaRecorder;

    AudioContext?: typeof AudioContext;
    requestAnimationFrame?: typeof requestAnimationFrame;
    cancelAnimationFrame?: typeof cancelAnimationFrame;
};

export function getDefaultBrowserEnvironment(): AudioRecorderBrowserEnvironment {
    return {
        ...(typeof navigator === 'undefined'
            ? {}
            : { navigator }),
        ...(typeof MediaRecorder === 'undefined'
            ? {}
            : { MediaRecorder }),

        ...(typeof AudioContext === 'undefined'
            ? {}
            : { AudioContext }),

        ...(typeof requestAnimationFrame === 'undefined'
            ? {}
            : { requestAnimationFrame }),

        ...(typeof cancelAnimationFrame === 'undefined'
            ? {}
            : { cancelAnimationFrame }),
    };
}

export function detectAudioRecorderBrowserSupport(
    environment: AudioRecorderBrowserEnvironment =
    getDefaultBrowserEnvironment(),
): AudioRecorderBrowserSupport {
    const isBrowser =
        environment.navigator !== undefined ||
        environment.MediaRecorder !== undefined;

    const hasMediaDevices =
        environment.navigator?.mediaDevices !== undefined;

    const hasGetUserMedia =
        typeof environment.navigator?.mediaDevices?.getUserMedia ===
        'function';

    const hasMediaRecorder =
        typeof environment.MediaRecorder === 'function';

    return Object.freeze({
        isBrowser,
        hasMediaDevices,
        hasGetUserMedia,
        hasMediaRecorder,
        isSupported:
            isBrowser &&
            hasMediaDevices &&
            hasGetUserMedia &&
            hasMediaRecorder,
    });
}