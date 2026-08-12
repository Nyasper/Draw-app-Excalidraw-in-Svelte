<script lang="ts">
	import { loading } from '$lib/loading.svelte';

	let visible = $state(false);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (loading.isLoading) {
			if (hideTimer) {
				clearTimeout(hideTimer);
				hideTimer = null;
			}
			visible = true;
			return;
		}

		// Keep the bar visible briefly so fast operations don't cause a flicker.
		if (visible) {
			if (hideTimer) clearTimeout(hideTimer);
			hideTimer = setTimeout(() => {
				visible = false;
				hideTimer = null;
			}, 250);
		}
	});

	$effect(() => {
		return () => {
			if (hideTimer) clearTimeout(hideTimer);
		};
	});
</script>

<div class="loading-bar" class:active={visible} aria-hidden="true">
	<div class="loading-bar-fill"></div>
</div>

<style>
	.loading-bar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		z-index: 10000;
		pointer-events: none;
		opacity: 0;
		transition: opacity 0.2s;
		overflow: hidden;
	}

	.loading-bar.active {
		opacity: 1;
	}

	.loading-bar-fill {
		position: absolute;
		top: 0;
		left: 0;
		height: 100%;
		width: 40%;
		border-radius: 0 999px 999px 0;
		background: linear-gradient(90deg, transparent, var(--accent) 50%, var(--accent-hover));
		box-shadow: 0 0 8px var(--accent);
		animation: loading-sweep 1.1s ease-in-out infinite;
	}

	@keyframes loading-sweep {
		from {
			left: -40%;
		}
		to {
			left: 100%;
		}
	}
</style>
