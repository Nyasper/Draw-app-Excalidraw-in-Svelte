<script lang="ts">
	import { resolve } from '$app/paths';
	import Dashboard from '$lib/components/Dashboard.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Svelte Excalidraw App</title>
</svelte:head>

{#if data.user}
	<Dashboard
		user={data.user}
		folders={data.folders}
		drawings={data.drawings}
		selectedFolderId={data.selectedFolderId}
		message={data.message}
	/>
{:else}
	<div class="landing">
		<div class="hero">
			<h1>Draw freely. Save when ready.</h1>
			<p>
				A full-stack drawing app powered by Excalidraw, wrapped in Svelte. Draw instantly as a
				guest, or create an account to save your work to the cloud.
			</p>
			<div class="hero-actions">
				<a href={resolve('/draw')} class="btn btn-primary">Start drawing</a>
				<a href={resolve('/login')} class="btn btn-secondary">Sign in</a>
			</div>
		</div>
		<div class="features">
			<div class="feature">
				<h3>Draw without limits</h3>
				<p>Full Excalidraw canvas &mdash; shapes, freehand, arrows, text, and more.</p>
			</div>
			<div class="feature">
				<h3>Save to the cloud</h3>
				<p>Create an account and your drawings are persisted to PostgreSQL automatically.</p>
			</div>
			<div class="feature">
				<h3>Organize with folders</h3>
				<p>Group your drawings into folders to keep your workflow tidy.</p>
			</div>
		</div>
		<footer class="landing-footer">
			<a href={resolve('/about')}>About this project</a>
		</footer>
	</div>
{/if}

<style>
	.landing {
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.hero {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 4rem 2rem;
		max-width: 600px;
		margin: 0 auto;
	}

	.hero h1 {
		font-size: 2.2rem;
		margin-bottom: 1rem;
		line-height: 1.3;
	}

	.hero p {
		color: var(--text-muted);
		font-size: 1.05rem;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
	}

	.features {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	.feature {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 1.5rem;
		text-align: center;
	}

	.feature h3 {
		font-size: 0.95rem;
		margin-bottom: 0.5rem;
	}

	.feature p {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.landing-footer {
		text-align: center;
		padding: 2rem;
		font-size: 0.85rem;
	}

	@media (max-width: 640px) {
		.features {
			grid-template-columns: 1fr;
		}
	}
</style>
