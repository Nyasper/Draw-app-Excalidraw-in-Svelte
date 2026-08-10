import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, PUT } from '../../src/routes/draw/[id]/+server';
import type { RequestEvent } from '../../src/routes/draw/[id]/$types';
import { createDrawing } from '$lib/server/db/queries';
import { db } from '$lib/server/db';
import { drawing } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { createTestUser, resetDb } from '../helpers/db';
import { createEvent, jsonRequest } from '../helpers/request';

vi.mock('$env/dynamic/private', () => ({
	env: { DATABASE_URL: 'postgres://root:mysecretpassword@localhost:5432/svelte_excalidraw_test' }
}));

beforeEach(async () => {
	await resetDb();
	await createTestUser('user-a');
	await createTestUser('user-b');
});

function eventFor(id: string, user?: { id: string }, request?: Request) {
	return createEvent<RequestEvent>({ user, params: { id }, request });
}

describe('PUT /draw/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await PUT(eventFor('1', undefined, jsonRequest({ title: 'x' })));
		expect(res.status).toBe(401);
	});

	it('returns 400 for a non-numeric id', async () => {
		const res = await PUT(eventFor('abc', { id: 'user-a' }, jsonRequest({ title: 'x' })));
		expect(res.status).toBe(400);
		await expect(res.json()).resolves.toEqual({ error: 'Invalid ID' });
	});

	it('returns 404 when the drawing does not exist', async () => {
		const res = await PUT(eventFor('999999', { id: 'user-a' }, jsonRequest({ title: 'x' })));
		expect(res.status).toBe(404);
	});

	it('owner can update title and content', async () => {
		const created = await createDrawing('user-a', 'Original');
		const body = { title: 'Renamed', elements: [{ id: 'e1' }] };
		const res = await PUT(eventFor(String(created.id), { id: 'user-a' }, jsonRequest(body)));

		expect(res.status).toBe(200);
		const updated = (await res.json()) as { title: string; elements: unknown };
		expect(updated.title).toBe('Renamed');
		expect(updated.elements).toEqual([{ id: 'e1' }]);
	});

	it('returns 404 for another user and leaves data untouched', async () => {
		const created = await createDrawing('user-a', 'Original');
		const res = await PUT(
			eventFor(String(created.id), { id: 'user-b' }, jsonRequest({ title: 'Hacked' }))
		);

		expect(res.status).toBe(404);

		const [row] = await db.select().from(drawing).where(eq(drawing.id, created.id));
		expect(row.title).toBe('Original');
	});
});

describe('DELETE /draw/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await DELETE(eventFor('1'));
		expect(res.status).toBe(401);
	});

	it('returns 400 for a non-numeric id', async () => {
		const res = await DELETE(eventFor('abc', { id: 'user-a' }));
		expect(res.status).toBe(400);
	});

	it('returns 404 when the drawing does not exist', async () => {
		const res = await DELETE(eventFor('999999', { id: 'user-a' }));
		expect(res.status).toBe(404);
	});

	it('owner can delete a drawing', async () => {
		const created = await createDrawing('user-a', 'Bye');
		const res = await DELETE(eventFor(String(created.id), { id: 'user-a' }));
		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual({ ok: true });

		const rows = await db.select().from(drawing).where(eq(drawing.id, created.id));
		expect(rows).toHaveLength(0);
	});

	it('returns 404 for another user and keeps the drawing', async () => {
		const created = await createDrawing('user-a', 'Keep me');
		const res = await DELETE(eventFor(String(created.id), { id: 'user-b' }));
		expect(res.status).toBe(404);

		const rows = await db.select().from(drawing).where(eq(drawing.id, created.id));
		expect(rows).toHaveLength(1);
	});
});
