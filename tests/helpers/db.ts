import { db } from '$lib/server/db';
import { account, drawing, folder, session, user, verification } from '$lib/server/db/schema';

/** Wipes every row from the shared test database. Call before each test. */
export async function resetDb() {
	await db.delete(drawing);
	await db.delete(folder);
	await db.delete(session);
	await db.delete(account);
	await db.delete(user);
	await db.delete(verification);
}

/** Inserts a minimal user row so FK constraints are satisfied when creating drawings/folders. */
export async function createTestUser(id: string, email = `${id}@example.com`) {
	const now = new Date();
	return db.insert(user).values({
		id,
		username: id,
		email,
		emailVerified: true,
		createdAt: now,
		updatedAt: now
	});
}
