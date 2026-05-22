import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { drawing } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
	const id = Number(event.params.id);
	if (isNaN(id)) throw error(400, 'Invalid drawing ID');

	const user = event.locals.user;
	const ownershipFilter = user ? eq(drawing.userId, user.id) : isNull(drawing.userId);

	const rows = await db
		.select()
		.from(drawing)
		.where(and(eq(drawing.id, id), ownershipFilter));
	if (rows.length === 0) throw error(404, 'Drawing not found');

	const d = rows[0];

	return {
		user: event.locals.user ?? null,
		drawing: {
			id: d.id,
			title: d.title,
			folderId: d.folderId,
			elements: d.elements as Record<string, unknown>[] | null,
			appState: d.appState as Record<string, unknown> | null,
			files: d.files as Record<string, unknown> | null,
			createdAt: d.createdAt.toISOString(),
			updatedAt: d.updatedAt.toISOString()
		}
	};
};
