<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head>
	<title>Register — Svelte Excalidraw App</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<h1>Register</h1>

		<form method="post" action="?/signUpEmail" use:enhance>
			<label>
				Username
				<input type="text" name="username" required />
			</label>
			<label>
				Email
				<input type="email" name="email" required />
			</label>
			<label>
				Password
				<input type="password" name="password" required minlength="8" />
			</label>
			<label>
				Confirm password
				<input type="password" name="passwordConfirm" required minlength="8" />
			</label>
			<button class="btn btn-primary" type="submit">Create account</button>
		</form>

		{#if form?.message}
			<p
				class="feedback"
				class:error={form.message.includes('failed') ||
					form.message.includes('not match') ||
					form.message.includes('least 8')}
			>
				{form.message}
			</p>
		{/if}

		<div class="divider">
			<span>or</span>
		</div>

		<form method="post" action="?/signInSocial" use:enhance>
			<input type="hidden" name="provider" value="github" />
			<input type="hidden" name="callbackURL" value="/" />
			<button class="btn btn-secondary" type="submit">
				<svg class="github-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path
						fill-rule="evenodd"
						clip-rule="evenodd"
						d="M12 2C6.475 2 2 6.475 2 12C2 16.425 4.8625 20.1625 8.8375 21.4875C9.3375 21.575 9.525 21.275 9.525 21.0125C9.525 20.775 9.5125 19.9875 9.5125 19.15C7 19.6125 6.35 18.5375 6.15 17.975C6.0375 17.6875 5.55 16.8 5.125 16.5625C4.775 16.375 4.275 15.9125 5.1125 15.9C5.9 15.8875 6.4625 16.625 6.65 16.925C7.55 18.4375 8.9875 18.0125 9.5625 17.75C9.65 17.1 9.9125 16.6625 10.2 16.4125C7.975 16.1625 5.65 15.3 5.65 11.475C5.65 10.3875 6.0375 9.4875 6.675 8.7875C6.575 8.5375 6.225 7.5125 6.775 6.1375C6.775 6.1375 7.6125 5.875 9.525 7.1625C10.325 6.9375 11.175 6.825 12.025 6.825C12.875 6.825 13.725 6.9375 14.525 7.1625C16.4375 5.8625 17.275 6.1375 17.275 6.1375C17.825 7.5125 17.475 8.5375 17.375 8.7875C18.0125 9.4875 18.4 10.375 18.4 11.475C18.4 15.3125 16.0625 16.1625 13.8375 16.4125C14.2 16.725 14.5125 17.325 14.5125 18.2625C14.5125 19.6 14.5 20.675 14.5 21.0125C14.5 21.275 14.6875 21.5875 15.1875 21.4875C17.1727 20.8173 18.8977 19.5415 20.1198 17.8395C21.3419 16.1376 21.9995 14.0953 22 12C22 6.475 17.525 2 12 2Z"
						fill="currentColor"
					/>
				</svg>
				Sign up with GitHub
			</button>
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
	}

	.feedback {
		font-size: 0.85rem;
		text-align: center;
		margin-top: 0.5rem;
		color: var(--success);
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

	.github-icon {
		width: 1.25rem;
		height: 1.25rem;
		fill: currentColor;
		flex-shrink: 0;
	}

	.switch {
		text-align: center;
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
</style>
