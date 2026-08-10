import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '$lib/server/db';
import { drawing } from '$lib/server/db/schema';
import {
	createDrawing,
	createFolder,
	renameFolder,
	deleteFolder,
	getUserDrawings,
	getUserFolders,
	getFolderDrawings,
	updateDrawing,
	deleteDrawing,
	countUserDrawings,
	countUserFolders
} from '$lib/server/db/queries';
import { createTestUser, resetDb } from '../helpers/db';

vi.mock('$env/dynamic/private', () => ({
	env: { DATABASE_URL: 'postgres://root:mysecretpassword@localhost:5432/svelte_excalidraw_test' }
}));

beforeEach(async () => {
	await resetDb();
	await createTestUser('user-a');
	await createTestUser('user-b');
});

describe('createDrawing', () => {
	it('creates a drawing for the user', async () => {
		const row = await createDrawing('user-a', 'My sketch');
		expect(row.id).toBeGreaterThan(0);
		expect(row.userId).toBe('user-a');
		expect(row.title).toBe('My sketch');
		expect(row.elements).toBeNull();
	});

	it('links an existing folder when provided', async () => {
		const folder = await createFolder('user-a', 'Work');
		const row = await createDrawing('user-a', 'In folder', folder.id);
		expect(row.folderId).toBe(folder.id);
	});
});

describe('getUserDrawings / getFolderDrawings', () => {
	it('returns only drawings owned by the user, newest first', async () => {
		const older = new Date('2024-01-01T00:00:00.000Z');
		const newer = new Date('2024-01-02T00:00:00.000Z');
		await db.insert(drawing).values([
			{ userId: 'user-a', title: 'old', createdAt: older, updatedAt: older },
			{ userId: 'user-a', title: 'new', createdAt: newer, updatedAt: newer },
			{ userId: 'user-b', title: 'foreign', createdAt: newer, updatedAt: newer }
		]);

		const rows = await getUserDrawings('user-a');

		expect(rows.map((r) => r.title)).toEqual(['new', 'old']);
	});

	it('filters by both user and folder', async () => {
		const f1 = await createFolder('user-a', 'F1');
		const f2 = await createFolder('user-a', 'F2');
		await createDrawing('user-a', 'in-f1', f1.id);
		await createDrawing('user-a', 'in-f2', f2.id);
		await createDrawing('user-b', 'foreign-but-same-folder', f1.id);

		const rows = await getFolderDrawings('user-a', f1.id);

		expect(rows.map((r) => r.title)).toEqual(['in-f1']);
	});
});

describe('getUserFolders', () => {
	it('returns only the user folders ordered by name', async () => {
		await createFolder('user-a', 'Zebra');
		await createFolder('user-a', 'Alpha');
		await createFolder('user-b', 'Foreign');

		const rows = await getUserFolders('user-a');

		expect(rows.map((r) => r.name)).toEqual(['Alpha', 'Zebra']);
	});
});

describe('updateDrawing', () => {
	it('owner can rename and change content', async () => {
		const created = await createDrawing('user-a', 'Original');
		const updated = await updateDrawing(created.id, 'user-a', {
			title: 'Renamed',
			elements: [{ id: 'e1' }]
		});
		expect(updated?.title).toBe('Renamed');
		expect(updated?.elements).toEqual([{ id: 'e1' }]);
	});

	it('another user cannot update it and the data is untouched', async () => {
		const created = await createDrawing('user-a', 'Original');
		const updated = await updateDrawing(created.id, 'user-b', { title: 'Hacked' });
		expect(updated).toBeNull();

		const [row] = await db.select().from(drawing).where(eq(drawing.id, created.id));
		expect(row.title).toBe('Original');
	});
});

describe('deleteDrawing', () => {
	it('another user cannot delete it', async () => {
		const created = await createDrawing('user-a', 'Keep me');
		const deleted = await deleteDrawing(created.id, 'user-b');
		expect(deleted).toBeNull();

		const rows = await db.select().from(drawing).where(eq(drawing.id, created.id));
		expect(rows).toHaveLength(1);
	});

	it('owner can delete it', async () => {
		const created = await createDrawing('user-a', 'Bye');
		const deleted = await deleteDrawing(created.id, 'user-a');
		expect(deleted?.id).toBe(created.id);

		const rows = await db.select().from(drawing).where(eq(drawing.id, created.id));
		expect(rows).toHaveLength(0);
	});
});

describe('renameFolder / deleteFolder', () => {
	it('owner can rename a folder', async () => {
		const folder = await createFolder('user-a', 'Before');
		const renamed = await renameFolder(folder.id, 'user-a', 'After');
		expect(renamed?.name).toBe('After');
	});

	it('another user cannot rename a folder', async () => {
		const folder = await createFolder('user-a', 'Before');
		const renamed = await renameFolder(folder.id, 'user-b', 'Hacked');
		expect(renamed).toBeNull();
	});

	it('another user cannot delete a folder', async () => {
		const folder = await createFolder('user-a', 'Keep me');
		const deleted = await deleteFolder(folder.id, 'user-b');
		expect(deleted).toBeNull();
	});

	it('owner can delete a folder', async () => {
		const folder = await createFolder('user-a', 'Bye');
		const deleted = await deleteFolder(folder.id, 'user-a');
		expect(deleted?.id).toBe(folder.id);
	});
});

describe('counters', () => {
	it('counts only the user rows', async () => {
		await createDrawing('user-a', 'a1');
		await createDrawing('user-a', 'a2');
		await createDrawing('user-b', 'b1');
		await createFolder('user-a', 'A');
		await createFolder('user-b', 'B');

		expect(await countUserDrawings('user-a')).toBe(2);
		expect(await countUserFolders('user-a')).toBe(1);
		expect(await countUserDrawings('user-b')).toBe(1);
		expect(await countUserFolders('user-b')).toBe(1);
	});
});
