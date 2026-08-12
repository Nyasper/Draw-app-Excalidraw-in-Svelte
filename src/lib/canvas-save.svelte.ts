export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * Tracks the save indicator lifecycle shared by the two canvas pages.
 * `saved` automatically falls back to `idle` after a short delay so the
 * UI does not stay green forever.
 */
export class SaveController {
	status = $state<SaveStatus>('idle');
	private resetTimer: ReturnType<typeof setTimeout> | null = null;

	begin() {
		this.status = 'saving';
	}

	succeed() {
		this.status = 'saved';
		if (this.resetTimer) clearTimeout(this.resetTimer);
		this.resetTimer = setTimeout(() => {
			if (this.status === 'saved') this.status = 'idle';
		}, 2000);
	}

	fail() {
		this.status = 'error';
	}

	destroy() {
		if (this.resetTimer) clearTimeout(this.resetTimer);
		this.resetTimer = null;
	}
}
