<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Forgot Password — Svelte Excalidraw App</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h1>Forgot your password?</h1>
		<p class="description">
			Enter your email address and we'll send you a link to reset your password.
		</p>

		<form method="post" action="?/requestReset" use:enhance>
			<label>
				Email
				<input type="email" name="email" required />
			</label>
			<button class="btn btn-primary" type="submit">Send reset link</button>
		</form>

		{#if form?.message}
			<p class="message">{form.message}</p>
		{/if}

		<p class="switch">
			<a href={resolve('/login')}>Back to login</a>
		</p>
	</div>
</div>

<style>
	.auth-page {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1;
		padding: 2rem;
	}

	.auth-card {
		width: 100%;
		max-width: 380px;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 2rem;
	}

	h1 {
		font-size: 1.5rem;
		margin-bottom: 0.75rem;
		text-align: center;
	}

	.description {
		font-size: 0.85rem;
		color: var(--text-muted);
		text-align: center;
		margin-bottom: 1.5rem;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.btn {
		width: 100%;
		padding: 0.6rem;
		margin-top: 0.5rem;
	}

	.message {
		color: var(--success);
		font-size: 0.85rem;
		text-align: center;
		margin-top: 0.5rem;
	}

	.switch {
		text-align: center;
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
</style>
