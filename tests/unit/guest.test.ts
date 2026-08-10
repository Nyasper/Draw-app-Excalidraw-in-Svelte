import { describe, expect, it } from 'vitest';
import { GUEST_STORAGE_KEY, loadGuestData, saveGuestData } from '$lib/guest';

describe('saveGuestData', () => {
	it('serializes only the three data buckets into JSON', () => {
		const raw = saveGuestData({
			elements: [{ id: 'a' }],
			appState: { zoom: 1.5 },
			files: { fileId: { dataURL: 'data:image/png;base64,x' } }
		});
		expect(JSON.parse(raw)).toEqual({
			elements: [{ id: 'a' }],
			appState: { zoom: 1.5 },
			files: { fileId: { dataURL: 'data:image/png;base64,x' } }
		});
	});
});

describe('loadGuestData', () => {
	it('returns null for a missing payload', () => {
		expect(loadGuestData(null)).toBeNull();
	});

	it('returns null for an empty payload', () => {
		expect(loadGuestData('')).toBeNull();
	});

	it('returns null for malformed JSON', () => {
		expect(loadGuestData('{not json')).toBeNull();
	});

	it('restores elements/files and resets collaborators to an empty Map', () => {
		const raw = saveGuestData({
			elements: [{ id: 'rect', type: 'rectangle' }],
			appState: { zoom: 0.5, collaborators: [] },
			files: { f1: { mimeType: 'image/png' } }
		});
		const loaded = loadGuestData(raw);
		expect(loaded).not.toBeNull();
		expect(loaded?.elements).toEqual([{ id: 'rect', type: 'rectangle' }]);
		expect(loaded?.files).toEqual({ f1: { mimeType: 'image/png' } });
		expect(loaded?.appState).toBeInstanceOf(Object);
		expect(loaded?.appState?.collaborators).toBeInstanceOf(Map);
		expect((loaded?.appState?.collaborators as Map<unknown, unknown>).size).toBe(0);
	});

	it('round-trips a snapshot through save + load', () => {
		const snapshot = {
			elements: [{ id: 'el', x: 10, y: 20 }],
			appState: { zoom: 2, theme: 'dark' },
			files: {}
		};
		const loaded = loadGuestData(saveGuestData(snapshot));
		expect(loaded?.elements).toEqual(snapshot.elements);
		expect(loaded?.files).toEqual(snapshot.files);
		expect(loaded?.appState?.zoom).toBe(2);
		expect(loaded?.appState?.theme).toBe('dark');
	});

	it('keeps the documented storage key', () => {
		expect(GUEST_STORAGE_KEY).toBe('excalidraw-guest');
	});
});
