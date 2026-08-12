import { SvelteSet } from 'svelte/reactivity';

/**
 * Global loading service.
 *
 * Tracks two complementary signals:
 * - a global pending counter that drives the top progress bar, and
 * - a set of named "pending keys" that drive per-button spinners.
 *
 * Start/stop calls must be balanced; `withLoading`/`withPending` release the
 * counter even when the wrapped promise rejects.
 */
export class LoadingService {
	#pending = $state(0);
	#keys = new SvelteSet<string>();

	readonly isLoading = $derived(this.#pending > 0);

	/** Resets the service state. Mostly useful in tests. */
	reset() {
		this.#pending = 0;
		this.#keys.clear();
	}

	startLoading() {
		this.#pending += 1;
	}

	stopLoading() {
		if (this.#pending > 0) this.#pending -= 1;
	}

	isPending(key: string) {
		return this.#keys.has(key);
	}

	startKey(key: string) {
		this.#keys.add(key);
		this.#pending += 1;
	}

	stopKey(key: string) {
		this.#keys.delete(key);
		if (this.#pending > 0) this.#pending -= 1;
	}

	/** Runs `fn` while the global loading bar is shown; the counter is released in `finally`. */
	async withLoading<T>(fn: () => Promise<T>): Promise<T> {
		this.startLoading();
		try {
			return await fn();
		} finally {
			this.stopLoading();
		}
	}

	/** Runs `fn` while the given button key and the global bar are active. */
	async withPending<T>(key: string, fn: () => Promise<T>): Promise<T> {
		this.startKey(key);
		try {
			return await fn();
		} finally {
			this.stopKey(key);
		}
	}
}

export const loading = new LoadingService();
