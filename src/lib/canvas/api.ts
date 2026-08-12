import { base } from '$app/paths';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, BinaryFiles } from '@excalidraw/excalidraw/types';

export interface ExcalidrawSnapshot {
	elements: readonly ExcalidrawElement[];
	appState: AppState;
	files: BinaryFiles;
}

type SnapshotBody = Partial<ExcalidrawSnapshot>;

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
	status: number;

	constructor(status: number, message?: string) {
		super(message ?? `Request failed with status ${status}`);
		this.status = status;
	}
}

function jsonInit(method: string, body: unknown): RequestInit {
	return { method, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
	const res = await fetch(`${base}${path}`, init);
	if (!res.ok) throw new ApiError(res.status, `Request to ${path} failed`);
	return (await res.json()) as T;
}

export function createDrawing(
	input: { title: string; folderId?: number } & SnapshotBody
): Promise<{ id: number }> {
	return request<{ id: number }>('/draw', jsonInit('POST', input));
}

export function updateDrawing(
	id: number,
	input: { title: string } & SnapshotBody
): Promise<unknown> {
	return request(`/draw/${id}`, jsonInit('PUT', input));
}

export function deleteDrawing(id: number): Promise<unknown> {
	return request(`/draw/${id}`, { method: 'DELETE' });
}
