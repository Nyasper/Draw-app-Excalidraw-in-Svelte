<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Register — Svelte Excalidraw App</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h1>Register</h1>

		<form method="post" action="?/signUpEmail" use:enhance>
			<label>
				Name
				<input type="text" name="name" required />
			</label>
			<label>
				Email
				<input type="email" name="email" required />
			</label>
			<label>
				Password
				<input type="password" name="password" required />
			</label>
			<button class="btn btn-primary" type="submit">Create account</button>
		</form>

		{#if form?.message}
			<p class="error">{form.message}</p>
		{/if}

		<div class="divider">
			<span>or</span>
		</div>

		<form method="post" action="?/signInSocial" use:enhance>
			<input type="hidden" name="provider" value="github" />
			<input type="hidden" name="callbackURL" value="/" />
			<button class="btn btn-secondary" type="submit"> Sign up with GitHub </button>
		</form>

		<p class="switch">
			Already have an account? <a href={resolve('/login')}>Login</a>
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

	.divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin: 1.5rem 0;

		&::before,
		&::after {
			content: '';
			flex: 1;
			height: 1px;
			background-color: var(--border);
		}

		span {
			color: var(--text-muted);
			font-size: 0.8rem;
		}
	}

	.switch {
		text-align: center;
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
</style>
