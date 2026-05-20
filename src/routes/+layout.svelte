<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const isCanvas = $derived(page.url.pathname.startsWith('/draw'));
	const showVerifyBanner = $derived(data.user && data.emailVerified === false && !isCanvas);
	const showFooter = $derived(!isCanvas);
	let bannerDismissed = $state(false);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	{#if !isCanvas}
		<Nav user={data.user} />
	{/if}

	{#if showVerifyBanner && !bannerDismissed}
		<div class="verify-banner">
			<span>Your email is not verified. Check your inbox or resend the verification email.</span>
			<form method="post" action={resolve('/?/resendVerification')} use:enhance>
				<button class="btn btn-secondary btn-sm" type="submit">Resend verification</button>
			</form>
			<button class="dismiss-btn" onclick={() => (bannerDismissed = true)} aria-label="Dismiss"
				>&times;</button
			>
		</div>
	{/if}

	<main class="main-content" class:canvas={isCanvas}>
		{@render children()}
	</main>

	{#if showFooter}
		<footer class="app-footer">
			<span>&copy; {new Date().getFullYear()} Nyasper — Svelte Excalidraw App</span>
			<a href={resolve('/about')} class="footer-link">Read about this project</a>
		</footer>
	{/if}
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.main-content.canvas {
		overflow: hidden;
	}

	.verify-banner {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.5rem 1.5rem;
		background-color: rgba(105, 101, 219, 0.15);
		border-bottom: 1px solid var(--accent);
		font-size: 0.85rem;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.verify-banner span {
		flex: 1;
	}

	.btn-sm {
		font-size: 0.75rem;
		padding: 0.3rem 0.75rem;
	}

	.dismiss-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1.25rem;
		padding: 0 0.25rem;
		line-height: 1;

		&:hover {
			color: var(--text-primary);
		}
	}

	.app-footer {
		text-align: center;
		padding: 1rem;
		font-size: 0.75rem;
		color: var(--text-muted);
		border-top: 1px solid var(--border);
		flex-shrink: 0;
		display: flex;
		justify-content: center;
		gap: 1rem;
		align-items: center;
	}

	.footer-link {
		color: var(--accent);
		text-decoration: none;

		&:hover {
			text-decoration: underline;
		}
	}
</style>
