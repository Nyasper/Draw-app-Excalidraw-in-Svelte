import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = async (event) => {
	const token = event.url.searchParams.get('token');
	if (!token) return redirect(302, '/login');
	return { token };
};

export const actions: Actions = {
	resetPassword: async (event) => {
		const formData = await event.request.formData();
		const token = formData.get('token')?.toString() ?? '';
		if (!token) return fail(400, { message: 'Invalid or expired token' });

		const password = formData.get('password')?.toString() ?? '';
		const passwordConfirm = formData.get('passwordConfirm')?.toString() ?? '';

		if (!password || password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters' });
		}
		if (password !== passwordConfirm) {
			return fail(400, { message: 'Passwords do not match' });
		}

		try {
			await auth.api.resetPassword({
				body: { newPassword: password, token }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Reset failed' });
			}
			console.error('resetPassword failed:', error);
			return fail(500, { message: 'Unexpected error' });
		}

		return redirect(302, '/login');
	}
};
