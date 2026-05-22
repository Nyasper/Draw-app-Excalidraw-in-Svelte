import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { env } from '$env/dynamic/private';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { sendEmail } from '$lib/server/email';

export const auth = betterAuth({
	baseURL: env.ORIGIN || undefined,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'pg' }),
	user: {
		fields: {
			name: 'username'
		}
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
		sendResetPassword: async ({ user, url }) => {
			const result = await sendEmail({
				to: user.email,
				subject: 'Reset your password - Excalidraw App',
				html: emailTemplate({
					title: 'Reset your password',
					body: `<p>You requested a password reset for your Excalidraw App account.</p>
					<p>Click the button below to set a new password. This link expires in 1 hour.</p>`,
					buttonText: 'Reset password',
					buttonUrl: url
				})
			});
			if (!result.ok) {
				console.error('Failed to send reset password email:', result.error);
				throw new Error('Failed to send reset password email');
			}
		},
		resetPasswordTokenExpiresIn: 3600
	},
	emailVerification: {
		sendVerificationEmail: async ({ user, url }) => {
			const result = await sendEmail({
				to: user.email,
				subject: 'Verify your email - Excalidraw App',
				html: emailTemplate({
					title: 'Welcome to Excalidraw App!',
					body: `<p>Thanks for creating an account. Please verify your email address to get started.</p>`,
					buttonText: 'Verify email',
					buttonUrl: url
				})
			});
			if (!result.ok) {
				console.error('Failed to send verification email:', result.error);
				throw new Error('Failed to send verification email');
			}
		}
	},
	socialProviders:
		env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET
			? {
					github: {
						clientId: env.GITHUB_CLIENT_ID,
						clientSecret: env.GITHUB_CLIENT_SECRET
					}
				}
			: undefined,
	plugins: [sveltekitCookies(getRequestEvent)]
});

function emailTemplate({
	title,
	body,
	buttonText,
	buttonUrl
}: {
	title: string;
	body: string;
	buttonText: string;
	buttonUrl: string;
}) {
	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#1e1e1e;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#1e1e1e;padding:40px 0">
  <tr>
    <td align="center">
      <table width="480" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#252525;border-radius:8px;overflow:hidden;border:1px solid #3a3a3a">
        <tr>
          <td style="padding:32px 32px 0">
            <p style="margin:0 0 24px;font-size:16px;font-weight:700;color:#d4d4d4">Excalidraw App</p>
            <h1 style="margin:0 0 16px;font-size:20px;color:#d4d4d4;font-weight:600">${title}</h1>
            <div style="font-size:15px;color:#8b8b8b;line-height:1.6">${body}</div>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:24px 32px 8px">
            <a href="${buttonUrl}" style="display:inline-block;background-color:#6965db;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:500">${buttonText}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 32px">
            <p style="margin:0;font-size:13px;color:#5a5a5a;text-align:center">If you didn't request this, you can safely ignore this email.</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}
