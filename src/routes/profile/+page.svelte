<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
</script>

<svelte:head>
	<title>Profile — Svelte Excalidraw App</title>
</svelte:head>

<div class="profile-page">
	<h1>Profile</h1>

	<div class="profile-grid">
		<div class="profile-card">
			<div class="avatar">
				{data.user.name?.charAt(0)?.toUpperCase() ?? 'U'}
			</div>
			<h2>{data.user.name ?? 'User'}</h2>
			<p class="email">{data.user.email}</p>
			<span
				class="badge"
				class:verified={data.user.emailVerified}
				class:unverified={!data.user.emailVerified}
			>
				{data.user.emailVerified ? 'Verified' : 'Not verified'}
			</span>
		</div>

		<div class="stats-card">
			<h3>Account details</h3>
			<div class="stat">
				<span class="stat-label">Registered</span>
				<span class="stat-value">{new Date(data.stats.createdAt).toLocaleDateString()}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Drawings</span>
				<span class="stat-value">{data.stats.drawingsCount}</span>
			</div>
			<div class="stat">
				<span class="stat-label">Folders</span>
				<span class="stat-value">{data.stats.foldersCount}</span>
			</div>
		</div>
	</div>

	<div class="password-card">
		<h3>Change password</h3>

		<form method="post" action="?/changePassword" use:enhance>
			<label>
				Current password
				<input type="password" name="currentPassword" required />
			</label>
			<label>
				New password
				<input type="password" name="newPassword" required minlength="8" />
			</label>
			<label>
				Confirm new password
				<input type="password" name="confirmPassword" required minlength="8" />
			</label>
			<button class="btn btn-primary" type="submit">Change password</button>
		</form>

		{#if form?.message}
			<p
				class="feedback"
				class:error={form.message.includes('must') ||
					form.message.includes('match') ||
					form.message.includes('required')}
			>
				{form.message}
			</p>
		{/if}
	</div>
</div>

<style>
	.profile-page {
		max-width: 640px;
		margin: 3rem auto;
		padding: 0 1.5rem;
	}

	h1 {
		font-size: 1.8rem;
		margin-bottom: 2rem;
	}

	.profile-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
		margin-bottom: 1.5rem;
	}

	.profile-card {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 2rem;
		text-align: center;
	}

	.avatar {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background-color: var(--accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: 600;
		margin: 0 auto 1rem;
	}

	h2 {
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
	}

	.email {
		font-size: 0.85rem;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	.badge {
		display: inline-block;
		font-size: 0.75rem;
		padding: 0.2rem 0.6rem;
		border-radius: 999px;

		&.verified {
			background-color: rgba(109, 190, 109, 0.2);
			color: var(--success);
		}

		&.unverified {
			background-color: rgba(224, 108, 108, 0.2);
			color: var(--danger);
		}
	}

	.stats-card {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.5rem;
	}

	h3 {
		font-size: 0.9rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	.stat {
		display: flex;
		justify-content: space-between;
		padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
		font-size: 0.88rem;

		&:last-child {
			border-bottom: none;
		}
	}

	.stat-label {
		color: var(--text-muted);
	}

	.stat-value {
		color: var(--text-primary);
		font-weight: 500;
	}

	.password-card {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.5rem;
	}

	.password-card h3 {
		margin-top: 0;
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
		margin-top: 0.5rem;
	}

	.feedback {
		font-size: 0.85rem;
		text-align: center;
		margin-top: 0.75rem;
		color: var(--success);

		&.error {
			color: var(--danger);
		}
	}

	@media (max-width: 500px) {
		.profile-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
