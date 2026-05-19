<script lang="ts">
	import { resolve } from '$app/paths';
	import type { User } from 'better-auth';

	interface Props {
		user: User | null;
	}

	let { user }: Props = $props();
</script>

<nav class="nav">
	<div class="nav-left">
		<a href={resolve('/')} class="logo">Excalidraw App</a>
		<a href={resolve('/')} class="nav-link">Home</a>
		<a href={resolve('/about')} class="nav-link">About</a>
		<a href={resolve('/draw')} class="nav-link">Draw</a>
	</div>
	<div class="nav-right">
		{#if user}
			<span class="user-name">{user.name}</span>
			<form method="post" action={resolve('/?/signOut')}>
				<button class="btn btn-secondary" type="submit">Sign out</button>
			</form>
		{:else}
			<a href={resolve('/login')} class="btn btn-secondary">Login</a>
			<a href={resolve('/register')} class="btn btn-primary">Register</a>
		{/if}
	</div>
</nav>

<style>
	.nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		height: 48px;
		background-color: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.nav-left,
	.nav-right {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.logo {
		font-weight: 700;
		font-size: 1rem;
		color: var(--text-primary);
		margin-right: 0.5rem;

		&:hover {
			color: var(--accent);
		}
	}

	.nav-link {
		font-size: 0.85rem;
		color: var(--text-muted);

		&:hover {
			color: var(--text-primary);
		}
	}

	.user-name {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.nav-right .btn {
		font-size: 0.8rem;
		padding: 0.35rem 0.85rem;
	}
</style>
