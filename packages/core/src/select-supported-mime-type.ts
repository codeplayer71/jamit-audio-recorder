export function selectSupportedMimeType(
    preferredMimeTypes: readonly string[],
    isTypeSupported: (mimeType: string) => boolean,
): string | null {
    for (const mimeType of preferredMimeTypes) {
        if (isTypeSupported(mimeType)) {
            return mimeType;
        }
    }

    return null;
}