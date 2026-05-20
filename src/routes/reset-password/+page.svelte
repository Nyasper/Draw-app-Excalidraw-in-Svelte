<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Reset Password — Svelte Excalidraw App</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h1>Reset your password</h1>

		<form method="post" action="?/resetPassword" use:enhance>
			<label>
				New password
				<input type="password" name="password" required minlength="8" />
			</label>
			<label>
				Confirm new password
				<input type="password" name="passwordConfirm" required minlength="8" />
			</label>
			<button class="btn btn-primary" type="submit">Reset password</button>
		</form>

		{#if form?.message}
			<p class="error">{form.message}</p>
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
		margin-bottom: 1.5rem;
		text-align: center;
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

	.error {
		color: var(--danger);
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
