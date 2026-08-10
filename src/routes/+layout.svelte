<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { enhance, applyAction } from '$app/forms';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { githubIcon } from '$lib/components/icons.svelte';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();

	const isCanvas = $derived(page.url.pathname.startsWith('/draw'));
	const showVerifyBanner = $derived(data.user && data.emailVerified === false && !isCanvas);
	const showFooter = $derived(!isCanvas);
	let bannerDismissed = $state(false);
	let isSending = $state(false);
	let feedbackMessage = $state<string | null>(null);
	let feedbackType = $state<'success' | 'error' | null>(null);
	let cooldownTimer: ReturnType<typeof setTimeout> | null = null;
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
			<span
				>Please verify your email. A verification link was sent to your inbox. If you don't see the
				email, please check your spam folder.</span
			>
			{#if feedbackMessage}
				<span
					class="feedback"
					class:success={feedbackType === 'success'}
					class:error={feedbackType === 'error'}
				>
					{feedbackMessage}
				</span>
			{/if}
			<form
				method="post"
				action={resolve('/?/resendVerification')}
				use:enhance={() => {
					isSending = true;
					feedbackMessage = null;
					feedbackType = null;

					return async ({ result }) => {
						isSending = false;

						if (result.type === 'success') {
							feedbackMessage = 'Verification email sent!';
							feedbackType = 'success';
							if (cooldownTimer) clearTimeout(cooldownTimer);
							cooldownTimer = setTimeout(() => {
								feedbackMessage = null;
								feedbackType = null;
								cooldownTimer = null;
							}, 30000);
						} else if (result.type === 'failure') {
							feedbackMessage = 'Failed to send. Try again.';
							feedbackType = 'error';
						} else {
							await applyAction(result);
						}
					};
				}}
			>
				<button
					class="btn btn-secondary btn-sm"
					type="submit"
					disabled={isSending || feedbackType === 'success'}
				>
					{isSending ? 'Sending...' : 'Resend verification'}
				</button>
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
			<span>
				&copy; {new Date().getFullYear()}
				<a
					href="https://github.com/Nyasper"
					class="footer-link"
					target="_blank"
					rel="noopener noreferrer"
				>
					{@render githubIcon(13)}
					Nyasper
				</a>
				— Svelte Excalidraw App
			</span>
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

	.feedback {
		font-size: 0.8rem;
		font-weight: 500;
		white-space: nowrap;
	}

	.feedback.success {
		color: #4ade80;
	}

	.feedback.error {
		color: #f87171;
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
