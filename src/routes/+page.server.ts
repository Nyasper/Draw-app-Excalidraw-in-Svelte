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

	const folders = await getUserFolders(user.id).catch((err) => {
		console.error('Failed to load folders:', err);
		return [];
	});

	const drawings = selectedFolderId
		? await getFolderDrawings(user.id, selectedFolderId).catch((err) => {
				console.error('Failed to load folder drawings:', err);
				return [];
			})
		: await getUserDrawings(user.id).catch((err) => {
				console.error('Failed to load drawings:', err);
				return [];
			});

	return { user, folders, drawings, selectedFolderId, message: '' };
};

export const actions: Actions = {
	signOut: async (event) => {
		try {
			await auth.api.signOut({ headers: event.request.headers });
		} catch (err) {
			console.error('signOut failed:', err);
		}
		return redirect(302, '/');
	},
	resendVerification: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Not authenticated' });

		try {
			await auth.api.sendVerificationEmail({
				body: {
					email: user.email,
					callbackURL: `${event.url.origin}/`
				}
			});
		} catch (err) {
			console.error('resendVerification failed:', err);
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
		} catch (err) {
			console.error('createFolder failed:', err);
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

		let drawing;
		try {
			drawing = await createDrawing(user.id, title, folderIdStr ? Number(folderIdStr) : undefined);
		} catch (err) {
			console.error('createDrawing failed:', err);
			return fail(500, { message: 'Failed to create drawing' });
		}

		return redirect(302, `/draw/${drawing.id}`);
	}
};
