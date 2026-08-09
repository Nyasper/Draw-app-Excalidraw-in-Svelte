import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

export interface SendEmailResponse {
	ok: boolean;
	id?: string;
	error?: string;
}

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
	text: string;
}

let resend: Resend | null = null;

function getResend(): Resend | null {
	// Lazy init so a missing RESEND_API_KEY can't break the module (and with it the
	// whole Cloudflare Worker) at import time. Read at send time and fail gracefully.
	if (!env.RESEND_API_KEY) return null;
	if (!resend) resend = new Resend(env.RESEND_API_KEY);
	return resend;
}

export async function sendEmail({
	to,
	subject,
	html,
	text
}: SendEmailParams): Promise<SendEmailResponse> {
	const client = getResend();
	if (!client) {
		console.error('Resend error: RESEND_API_KEY is not set');
		return { ok: false, error: '[ConfigError] RESEND_API_KEY is not set' };
	}

	const { data, error } = await client.emails.send(
		{
			from: `Excalidraw App <noreply@${env.MY_DOMAIN}>`,
			to: [to],
			subject,
			html,
			text
		},
		{ idempotencyKey: `${subject.replace(/[^\w.-]+/g, '-').toLowerCase()}/${to}/${Date.now()}` }
	);

	if (error) {
		console.error('Resend email error:', error);
		return { ok: false, error: `[${error.name}] ${error.message}` };
	}

	return { ok: true, id: data?.id };
}
