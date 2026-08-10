import type { AppState } from '@excalidraw/excalidraw/types';

export const GUEST_STORAGE_KEY = 'excalidraw-guest';

export interface GuestSnapshot {
	elements?: unknown;
	appState?: AppState | Record<string, unknown>;
	files?: unknown;
}

/**
 * Serializes a guest snapshot into the localStorage payload. Keeps only the three
 * data buckets we round-trip (elements, appState, files) so nothing unexpected leaks.
 */
export function saveGuestData(snapshot: GuestSnapshot): string {
	return JSON.stringify({
		elements: snapshot.elements,
		appState: snapshot.appState,
		files: snapshot.files
	});
}

/**
 * Parses a guest snapshot previously written by {@link saveGuestData}. Returns `null`
 * for missing or malformed payloads. `collaborators` is always reset to an empty Map
 * because collaborators are session-scoped and must never be persisted/restored.
 */
export function loadGuestData(raw: string | null): GuestSnapshot | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as GuestSnapshot;
		return {
			...parsed,
			appState: { ...parsed.appState, collaborators: new Map() }
		};
	} catch {
		return null;
	}
}
