import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { countUserDrawings, countUserFolders } from '$lib/server/db/queries';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async (event) => {
	const user = event.locals.user;
	if (!user) return redirect(302, '/login');

	const drawingsCount = await countUserDrawings(user.id).catch((err) => {
		console.error('Failed to count drawings:', err);
		return 0;
	});
	const foldersCount = await countUserFolders(user.id).catch((err) => {
		console.error('Failed to count folders:', err);
		return 0;
	});

	return {
		user,
		stats: {
			drawingsCount,
			foldersCount,
			createdAt: user.createdAt
		}
	};
};

export const actions: Actions = {
	changePassword: async (event) => {
		const user = event.locals.user;
		if (!user) return fail(401, { message: 'Not authenticated' });

		const formData = await event.request.formData();
		const currentPassword = formData.get('currentPassword')?.toString() ?? '';
		const newPassword = formData.get('newPassword')?.toString() ?? '';
		const confirmPassword = formData.get('confirmPassword')?.toString() ?? '';

		if (!currentPassword) return fail(400, { message: 'Current password is required' });
		if (!newPassword || newPassword.length < 8)
			return fail(400, { message: 'New password must be at least 8 characters' });
		if (newPassword !== confirmPassword) return fail(400, { message: 'Passwords do not match' });

		try {
			await auth.api.changePassword({
				body: {
					currentPassword,
					newPassword
				},
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Change password failed' });
			}
			console.error('changePassword failed:', error);
			return fail(500, { message: 'Unexpected error' });
		}

		return { message: 'Password changed successfully' };
	}
};
