import { eq, asc, and } from 'drizzle-orm';
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
		.orderBy(asc(drawing.updatedAt));
}

export async function getFolderDrawings(userId: string, folderId: number) {
	return db
		.select()
		.from(drawing)
		.where(and(eq(drawing.userId, userId), eq(drawing.folderId, folderId)))
		.orderBy(asc(drawing.updatedAt));
}

export async function createDrawing(userId: string, title: string, folderId?: number) {
	const [row] = await db
		.insert(drawing)
		.values({ userId, title, folderId: folderId ?? null })
		.returning();
	return row;
}

export async function updateDrawing(
	id: number,
	data: {
		title?: string;
		elements?: unknown;
		appState?: unknown;
		files?: unknown;
		folderId?: number | null;
	}
) {
	const [row] = await db.update(drawing).set(data).where(eq(drawing.id, id)).returning();
	return row;
}

export async function deleteDrawing(id: number) {
	await db.delete(drawing).where(eq(drawing.id, id));
}

export async function createFolder(userId: string, name: string, parentFolderId?: number) {
	const [row] = await db
		.insert(folder)
		.values({ userId, name, parentFolderId: parentFolderId ?? null })
		.returning();
	return row;
}

export async function renameFolder(id: number, name: string) {
	const [row] = await db.update(folder).set({ name }).where(eq(folder.id, id)).returning();
	return row;
}

export async function deleteFolder(id: number) {
	await db.delete(folder).where(eq(folder.id, id));
}
