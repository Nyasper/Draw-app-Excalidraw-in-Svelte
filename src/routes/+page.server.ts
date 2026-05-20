import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import {
	getUserFolders,
	getUserDrawings,
	getFolderDrawings,
	createFolder,
	createDrawing
} from '$lib/server/db/queries';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) return { user: null, folders: [], drawings: [], selectedFolderId: null, message: '' };

	const folderParam = event.url.searchParams.get('folder');
	const selectedFolderId = folderParam ? Number(folderParam) : null;

	let folders = await getUserFolders(user.id).catch(() => []);
	if (folders.length === 0) {
		await createFolder(user.id, 'My Drawings').catch(() => {});
		folders = await getUserFolders(user.id).catch(() => []);
	}

	const drawings = selectedFolderId
		? await getFolderDrawings(user.id, selectedFolderId).catch(() => [])
		: await getUserDrawings(user.id).catch(() => []);

	return { user, folders, drawings, selectedFolderId, message: '' };
};

export const actions: Actions = {
	signOut: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		return redirect(302, '/');
	},
	resendVerification: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Not authenticated' });

		try {
			await auth.api.sendVerificationEmail({
				body: {
					email: user.email,
					callbackURL: `${process.env.ORIGIN || 'http://localhost:5173'}/`
				}
			});
		} catch {
			return fail(500, { message: 'Failed to send verification email' });
		}

		return { message: 'Verification email sent! Check your inbox.' };
	},
	createFolder: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Not authenticated' });

		const formData = await event.request.formData();
		const name = formData.get('folderName')?.toString()?.trim();
		if (!name) return fail(400, { message: 'Folder name is required' });

		try {
			await createFolder(user.id, name);
		} catch {
			return fail(500, { message: 'Failed to create folder' });
		}

		return {};
	},
	createDrawing: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Not authenticated' });

		const formData = await event.request.formData();
		const title = formData.get('title')?.toString()?.trim() ?? 'Untitled';
		const folderIdStr = formData.get('folderId')?.toString();

		try {
			const drawing = await createDrawing(
				user.id,
				title,
				folderIdStr ? Number(folderIdStr) : undefined
			);
			return redirect(302, `/draw/${drawing.id}`);
		} catch {
			return fail(500, { message: 'Failed to create drawing' });
		}
	}
};
