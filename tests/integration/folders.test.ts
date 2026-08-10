import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '../../src/routes/folders/+server';
import type { RequestEvent as FoldersEvent } from '../../src/routes/folders/$types';
import { DELETE as DELETE_ONE, PUT } from '../../src/routes/folders/[id]/+server';
import type { RequestEvent as FolderIdEvent } from '../../src/routes/folders/[id]/$types';
import { createFolder, getUserFolders } from '$lib/server/db/queries';
import { db } from '$lib/server/db';
import { folder } from '$lib/server/db/schema';
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

describe('GET /folders', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await GET(createEvent<FoldersEvent>());
		expect(res.status).toBe(401);
	});

	it('returns only the user folders', async () => {
		await createFolder('user-a', 'Mine');
		await createFolder('user-b', 'Not mine');
		const res = await GET(createEvent<FoldersEvent>({ user: { id: 'user-a' } }));
		expect(res.status).toBe(200);
		const rows = (await res.json()) as { name: string }[];
		expect(rows.map((r) => r.name)).toEqual(['Mine']);
	});
});

describe('POST /folders', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await POST(createEvent<FoldersEvent>({ request: jsonRequest({ name: 'X' }) }));
		expect(res.status).toBe(401);
	});

	it('returns 400 when the name is missing or blank', async () => {
		const res = await POST(
			createEvent<FoldersEvent>({ user: { id: 'user-a' }, request: jsonRequest({ name: '  ' }) })
		);
		expect(res.status).toBe(400);
		await expect(res.json()).resolves.toEqual({ error: 'Name is required' });
	});

	it('creates a folder for the user', async () => {
		const res = await POST(
			createEvent<FoldersEvent>({ user: { id: 'user-a' }, request: jsonRequest({ name: 'Work' }) })
		);
		expect(res.status).toBe(201);
		const created = (await res.json()) as { id: number; name: string };
		expect(created.name).toBe('Work');

		const rows = await getUserFolders('user-a');
		expect(rows.map((r) => r.name)).toEqual(['Work']);
	});
});

describe('PUT /folders/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await PUT(
			createEvent<FolderIdEvent>({ params: { id: '1' }, request: jsonRequest({ name: 'x' }) })
		);
		expect(res.status).toBe(401);
	});

	it('returns 400 for a non-numeric id', async () => {
		const res = await PUT(
			createEvent<FolderIdEvent>({
				user: { id: 'user-a' },
				params: { id: 'abc' },
				request: jsonRequest({ name: 'x' })
			})
		);
		expect(res.status).toBe(400);
	});

	it('returns 400 when the new name is blank', async () => {
		const created = await createFolder('user-a', 'Work');
		const res = await PUT(
			createEvent<FolderIdEvent>({
				user: { id: 'user-a' },
				params: { id: String(created.id) },
				request: jsonRequest({ name: ' ' })
			})
		);
		expect(res.status).toBe(400);
	});

	it('owner can rename a folder', async () => {
		const created = await createFolder('user-a', 'Before');
		const res = await PUT(
			createEvent<FolderIdEvent>({
				user: { id: 'user-a' },
				params: { id: String(created.id) },
				request: jsonRequest({ name: 'After' })
			})
		);
		expect(res.status).toBe(200);
		const renamed = (await res.json()) as { name: string };
		expect(renamed.name).toBe('After');
	});

	it('returns 404 for another user and leaves the name untouched', async () => {
		const created = await createFolder('user-a', 'Before');
		const res = await PUT(
			createEvent<FolderIdEvent>({
				user: { id: 'user-b' },
				params: { id: String(created.id) },
				request: jsonRequest({ name: 'Hacked' })
			})
		);
		expect(res.status).toBe(404);

		const [row] = await db.select().from(folder).where(eq(folder.id, created.id));
		expect(row.name).toBe('Before');
	});
});

describe('DELETE /folders/[id]', () => {
	it('returns 401 when not authenticated', async () => {
		const res = await DELETE_ONE(createEvent<FolderIdEvent>({ params: { id: '1' } }));
		expect(res.status).toBe(401);
	});

	it('returns 400 for a non-numeric id', async () => {
		const res = await DELETE_ONE(
			createEvent<FolderIdEvent>({ user: { id: 'user-a' }, params: { id: 'abc' } })
		);
		expect(res.status).toBe(400);
	});

	it('owner can delete a folder', async () => {
		const created = await createFolder('user-a', 'Bye');
		const res = await DELETE_ONE(
			createEvent<FolderIdEvent>({ user: { id: 'user-a' }, params: { id: String(created.id) } })
		);
		expect(res.status).toBe(200);
		await expect(res.json()).resolves.toEqual({ ok: true });

		const rows = await db.select().from(folder).where(eq(folder.id, created.id));
		expect(rows).toHaveLength(0);
	});

	it('returns 404 for another user and keeps the folder', async () => {
		const created = await createFolder('user-a', 'Keep me');
		const res = await DELETE_ONE(
			createEvent<FolderIdEvent>({ user: { id: 'user-b' }, params: { id: String(created.id) } })
		);
		expect(res.status).toBe(404);

		const rows = await db.select().from(folder).where(eq(folder.id, created.id));
		expect(rows).toHaveLength(1);
	});
});
