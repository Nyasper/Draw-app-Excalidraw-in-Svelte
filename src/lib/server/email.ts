import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');

const resend = new Resend(env.RESEND_API_KEY);

export interface SendEmailResponse {
	ok: boolean;
	id?: string;
	error?: string;
}

interface SendEmailParams {
	to: string;
	subject: string;
	html: string;
}

export async function sendEmail({
	to,
	subject,
	html
}: SendEmailParams): Promise<SendEmailResponse> {
	const { data, error } = await resend.emails.send(
		{
			from: `Excalidraw App <noreply@${env.MY_DOMAIN}>`,
			to: [to],
			subject,
			html
		},
		{ idempotencyKey: `${subject.replace(/\s+/g, '-').toLowerCase()}/${to}/${Date.now()}` }
	);

	if (error) {
		console.error('Resend email error:', error);
		return { ok: false, error: error.message };
	}

	return { ok: true, id: data?.id };
}
