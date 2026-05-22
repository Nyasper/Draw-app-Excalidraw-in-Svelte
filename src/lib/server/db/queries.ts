import { eq, asc, desc, and, count } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { folder, drawing } from '$lib/server/db/schema';

export async function getUserFolders(userId: string) {
	return db.select().from(folder).where(eq(folder.userId, userId)).orderBy(asc(folder.name));
}

export async function getUserDrawings(userId: string) {
	return db
		.select()
		.from(drawing)
		.where(eq(drawing.userId, userId))
		.orderBy(desc(drawing.updatedAt));
}

export async function getFolderDrawings(userId: string, folderId: number) {
	return db
		.select()
		.from(drawing)
		.where(and(eq(drawing.userId, userId), eq(drawing.folderId, folderId)))
		.orderBy(desc(drawing.updatedAt));
}

export async function createDrawing(userId: string, title: string, folderId?: number) {
	const [row] = await db
		.insert(drawing)
		.values({ userId, title, folderId: folderId ?? null })
		.returning();
	if (!row) throw new Error('Failed to create drawing');
	return row;
}

export async function updateDrawing(
	id: number,
	userId: string,
	data: {
		title?: string;
		elements?: unknown;
		appState?: unknown;
		files?: unknown;
		folderId?: number | null;
	}
) {
	const [row] = await db
		.update(drawing)
		.set(data)
		.where(and(eq(drawing.id, id), eq(drawing.userId, userId)))
		.returning();
	return row ?? null;
}

export async function deleteDrawing(id: number, userId: string) {
	const [row] = await db
		.delete(drawing)
		.where(and(eq(drawing.id, id), eq(drawing.userId, userId)))
		.returning();
	return row ?? null;
}

export async function createFolder(userId: string, name: string, parentFolderId?: number) {
	const [row] = await db
		.insert(folder)
		.values({ userId, name, parentFolderId: parentFolderId ?? null })
		.returning();
	if (!row) throw new Error('Failed to create folder');
	return row;
}

export async function renameFolder(id: number, userId: string, name: string) {
	const [row] = await db
		.update(folder)
		.set({ name })
		.where(and(eq(folder.id, id), eq(folder.userId, userId)))
		.returning();
	return row ?? null;
}

export async function deleteFolder(id: number, userId: string) {
	const [row] = await db
		.delete(folder)
		.where(and(eq(folder.id, id), eq(folder.userId, userId)))
		.returning();
	return row ?? null;
}

export async function countUserDrawings(userId: string) {
	const [row] = await db.select({ count: count() }).from(drawing).where(eq(drawing.userId, userId));
	return row?.count ?? 0;
}

export async function countUserFolders(userId: string) {
	const [row] = await db.select({ count: count() }).from(folder).where(eq(folder.userId, userId));
	return row?.count ?? 0;
}
