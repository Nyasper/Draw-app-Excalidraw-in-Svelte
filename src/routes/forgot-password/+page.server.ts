import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '$lib/server/auth';
import { APIError } from 'better-auth/api';

export const load: PageServerLoad = (event) => {
	if (event.locals.user) return redirect(302, '/');
	return {};
};

export const actions: Actions = {
	requestReset: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString() ?? '';

		if (!email) return fail(400, { message: 'Email is required' });

		try {
			await auth.api.requestPasswordReset({
				body: {
					email,
					redirectTo: `${event.url.origin}/reset-password`
				}
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(400, { message: error.message });
			}
			return fail(500, { message: 'Unexpected error' });
		}

		return { message: 'If an account with that email exists, a reset link has been sent.' };
	}
};
