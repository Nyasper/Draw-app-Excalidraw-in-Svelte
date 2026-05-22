import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) {
		return redirect(302, '/');
	}
	return {};
};

export const actions: Actions = {
	signUpEmail: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';
		const password = formData.get('password')?.toString() ?? '';
		const passwordConfirm = formData.get('passwordConfirm')?.toString() ?? '';
		const name = formData.get('username')?.toString() ?? '';

		if (!email) return fail(400, { message: 'Email is required' });
		if (!password || password.length < 8) {
			return fail(400, { message: 'Password must be at least 8 characters' });
		}
		if (password !== passwordConfirm) {
			return fail(400, { message: 'Passwords do not match' });
		}

		try {
			await auth.api.signUpEmail({
				body: { email, password, name, callbackURL: '/' }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message || 'Registration failed' });
			}
			console.error('signUpEmail failed:', error);
			return fail(500, { message: 'Unexpected error' });
		}

		return { message: 'Account created! Please check your email to verify your account.' };
	}
};
