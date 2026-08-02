const MIME_TYPE_EXTENSION_MAP: Readonly<Record<string, string>> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/aac': 'aac',
    'audio/flac': 'flac',
};

export function getFileExtensionFromMimeType(
    mimeType: string,
): string {
    const normalizedMimeType = mimeType
        .split(';', 1)[0]
        ?.trim()
        .toLowerCase();

    if (!normalizedMimeType) {
        return 'audio';
    }

    return MIME_TYPE_EXTENSION_MAP[normalizedMimeType] ?? 'audio';
}