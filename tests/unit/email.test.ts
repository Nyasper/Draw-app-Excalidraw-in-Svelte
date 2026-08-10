import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEmail } from '$lib/server/email';

const { mockEnv, resendCtor, sendMock } = vi.hoisted(() => ({
	mockEnv: { RESEND_API_KEY: '', MY_DOMAIN: 'example.com' },
	resendCtor: vi.fn(),
	sendMock: vi.fn()
}));

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

vi.mock('resend', () => ({
	Resend: class {
		constructor(apiKey: string) {
			resendCtor(apiKey);
		}

		emails = {
			send: (...args: unknown[]) => sendMock(...args)
		};
	}
}));

const baseEmail = {
	to: 'a@example.com',
	subject: 'Test email',
	html: '<p>Hello</p>',
	text: 'Hello'
};

beforeEach(() => {
	mockEnv.RESEND_API_KEY = '';
	mockEnv.MY_DOMAIN = 'example.com';
	resendCtor.mockReset();
	sendMock.mockReset();
});

describe('sendEmail', () => {
	it('fails gracefully when RESEND_API_KEY is not set', async () => {
		const result = await sendEmail(baseEmail);
		expect(result.ok).toBe(false);
		expect(result.error).toBe('[ConfigError] RESEND_API_KEY is not set');
		expect(resendCtor).not.toHaveBeenCalled();
	});

	it('sends via Resend and returns the message id on success', async () => {
		mockEnv.RESEND_API_KEY = 're_123';
		sendMock.mockResolvedValue({ data: { id: 'msg_123' }, error: null });

		const result = await sendEmail(baseEmail);

		expect(result).toEqual({ ok: true, id: 'msg_123' });
		expect(resendCtor).toHaveBeenCalledWith('re_123');
		expect(sendMock).toHaveBeenCalledTimes(1);
		const payload = sendMock.mock.calls[0][0] as {
			from: string;
			to: string[];
			subject: string;
			html: string;
			text: string;
		};
		expect(payload.from).toBe('Excalidraw App <noreply@example.com>');
		expect(payload.to).toEqual(['a@example.com']);
		expect(payload.subject).toBe('Test email');
		expect(payload.html).toBe('<p>Hello</p>');
		expect(payload.text).toBe('Hello');
	});

	it('maps a Resend error to a [name] message tuple', async () => {
		mockEnv.RESEND_API_KEY = 're_123';
		sendMock.mockResolvedValue({
			data: null,
			error: { name: 'rest_error', message: 'domain not verified' }
		});

		const result = await sendEmail(baseEmail);

		expect(result.ok).toBe(false);
		expect(result.error).toBe('[rest_error] domain not verified');
	});
});
