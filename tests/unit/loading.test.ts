import { describe, expect, it } from 'vitest';
import { LoadingService } from '$lib/loading.svelte';

describe('LoadingService', () => {
	it('toggles isLoading as pending operations start and stop', () => {
		const svc = new LoadingService();
		expect(svc.isLoading).toBe(false);

		svc.startLoading();
		expect(svc.isLoading).toBe(true);

		svc.startLoading();
		svc.stopLoading();
		expect(svc.isLoading).toBe(true);

		svc.stopLoading();
		expect(svc.isLoading).toBe(false);
	});

	it('never drops the counter below zero', () => {
		const svc = new LoadingService();
		svc.stopLoading();
		svc.stopLoading();
		expect(svc.isLoading).toBe(false);
	});

	it('tracks pending keys independently', () => {
		const svc = new LoadingService();
		svc.startKey('drawing:1');
		expect(svc.isPending('drawing:1')).toBe(true);
		expect(svc.isPending('drawing:2')).toBe(false);
		expect(svc.isLoading).toBe(true);

		svc.startKey('drawing:2');
		svc.stopKey('drawing:1');
		expect(svc.isPending('drawing:1')).toBe(false);
		expect(svc.isPending('drawing:2')).toBe(true);
		expect(svc.isLoading).toBe(true);

		svc.stopKey('drawing:2');
		expect(svc.isLoading).toBe(false);
	});

	it('withLoading releases the counter on success', async () => {
		const svc = new LoadingService();
		const result = await svc.withLoading(() => Promise.resolve(42));
		expect(result).toBe(42);
		expect(svc.isLoading).toBe(false);
	});

	it('withLoading releases the counter when the promise rejects', async () => {
		const svc = new LoadingService();
		await expect(svc.withLoading(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
		expect(svc.isLoading).toBe(false);
	});

	it('withPending clears the key on success', async () => {
		const svc = new LoadingService();
		await svc.withPending('sign-in', () => Promise.resolve());
		expect(svc.isPending('sign-in')).toBe(false);
		expect(svc.isLoading).toBe(false);
	});

	it('withPending clears the key when the promise rejects', async () => {
		const svc = new LoadingService();
		await expect(svc.withPending('sign-in', () => Promise.reject(new Error('nope')))).rejects.toThrow(
			'nope'
		);
		expect(svc.isPending('sign-in')).toBe(false);
		expect(svc.isLoading).toBe(false);
	});
});
