import { beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '../../src/routes/draw/+server';
import type { RequestEvent } from '../../src/routes/draw/$types';
import { createFolder } from '$lib/server/db/queries';
import { getUserDrawings } from '$lib/server/db/queries';
import { createTestUser, resetDb } from '../helpers/db';
import { createEvent, jsonRequest } from '../helpers/request';

vi.mock('$env/dynamic/private', () => ({
	env: { DATABASE_URL: 'postgres://root:mysecretpassword@localhost:5432/svelte_excalidraw_test' }
}));

beforeEach(async () => {
	await resetDb();
	await createTestUser('user-a');
});

describe('POST /draw', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await POST(createEvent<RequestEvent>());
		expect(res.status).toBe(401);
		await expect(res.json()).resolves.toEqual({ error: 'Not authenticated' });
	});

	it('creates a drawing and returns its id', async () => {
		const res = await POST(
			createEvent<RequestEvent>({
				user: { id: 'user-a' },
				request: jsonRequest({ title: 'Diagram' })
			})
		);

		expect(res.status).toBe(201);
		const body = (await res.json()) as { id: number };
		expect(body.id).toBeGreaterThan(0);

		const drawings = await getUserDrawings('user-a');
		expect(drawings).toHaveLength(1);
		expect(drawings[0].title).toBe('Diagram');
	});

	it('defaults the title to Untitled and stores elements/appState/files', async () => {
		const payload = {
			elements: [{ id: 'rect', type: 'rectangle' }],
			appState: { zoom: 1 },
			files: { f1: { mimeType: 'image/png' } }
		};
		const res = await POST(
			createEvent<RequestEvent>({ user: { id: 'user-a' }, request: jsonRequest(payload) })
		);

		expect(res.status).toBe(201);
		const drawings = await getUserDrawings('user-a');
		expect(drawings[0].title).toBe('Untitled');
		expect(drawings[0].elements).toEqual(payload.elements);
		expect(drawings[0].appState).toEqual(payload.appState);
		expect(drawings[0].files).toEqual(payload.files);
	});

	it('links the drawing to a folder when folderId is provided', async () => {
		const folder = await createFolder('user-a', 'Work');
		const res = await POST(
			createEvent<RequestEvent>({
				user: { id: 'user-a' },
				request: jsonRequest({ title: 'In folder', folderId: folder.id })
			})
		);

		expect(res.status).toBe(201);
		const drawings = await getUserDrawings('user-a');
		expect(drawings[0].folderId).toBe(folder.id);
	});

	it('returns 500 for a malformed JSON body', async () => {
		const res = await POST(
			createEvent<RequestEvent>({
				user: { id: 'user-a' },
				request: jsonRequest('{')
			})
		);
		expect(res.status).toBe(500);
		await expect(res.json()).resolves.toEqual({ error: 'Internal server error' });
	});
});
