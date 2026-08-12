import { base } from '$app/paths';
import type { FolderItem } from './types';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function jsonInit(method: string, body: unknown): RequestInit {
	return { method, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
	const res = await fetch(`${base}${path}`, init);
	if (!res.ok) throw new Error(`Request to ${path} failed with status ${res.status}`);
	return (await res.json()) as T;
}

export interface NewDrawingInput {
	title: string;
	folderId?: number;
}

export async function createDrawing(input: NewDrawingInput): Promise<{ id: number }> {
	return request<{ id: number }>('/draw', jsonInit('POST', input));
}

export async function createFolder(name: string): Promise<FolderItem> {
	return request<FolderItem>('/folders', jsonInit('POST', { name }));
}

export async function deleteDrawing(id: number): Promise<void> {
	await request(`/draw/${id}`, { method: 'DELETE' });
}

export async function deleteDrawings(ids: readonly number[]): Promise<void> {
	for (const id of ids) {
		await deleteDrawing(id);
	}
}

export async function moveDrawing(id: number, folderId: number | null): Promise<void> {
	await request(`/draw/${id}`, jsonInit('PUT', { folderId }));
}

export async function moveDrawings(ids: readonly number[], folderId: number | null): Promise<void> {
	for (const id of ids) {
		await moveDrawing(id, folderId);
	}
}

export async function renameDrawing(id: number, title: string): Promise<void> {
	await request(`/draw/${id}`, jsonInit('PUT', { title }));
}

export async function renameFolder(id: number, name: string): Promise<void> {
	await request(`/folders/${id}`, jsonInit('PUT', { name }));
}

export async function deleteFolder(id: number): Promise<void> {
	await request(`/folders/${id}`, { method: 'DELETE' });
}

export async function createFolderAndMoveDrawings(
	name: string,
	drawingIds: readonly number[]
): Promise<void> {
	const folder = await createFolder(name);
	await moveDrawings(drawingIds, folder.id);
}
