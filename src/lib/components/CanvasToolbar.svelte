<script lang="ts">
	import { resolve } from '$app/paths';
	import type { SaveStatus } from '$lib/canvas-save.svelte';

	interface Props {
		backUrl: string;
		guest: boolean;
		saveStatus: SaveStatus;
		showDelete?: boolean;
		onSave: () => void;
		onDelete?: () => void;
		title?: string;
	}

	let {
		backUrl,
		guest,
		saveStatus,
		showDelete = false,
		onSave,
		onDelete,
		title = $bindable('Untitled')
	}: Props = $props();
</script>

<div class="canvas-toolbar">
	<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- backUrl is already resolved by the caller -->
	<a href={backUrl} class="btn btn-secondary back-btn">&larr; Back</a>

	{#if guest}
		<div class="guest-banner">
			<span>Drawing as guest — your work is saved locally.</span>
			<a href={resolve('/register')} class="btn btn-primary">Sign up to save to the cloud</a>
		</div>
	{:else}
		<input class="title-input" type="text" bind:value={title} placeholder="Untitled" />
		<div class="save-area">
			{@render saveStatusText()}
			<button class="btn btn-primary" onclick={onSave}>Save</button>
			{#if showDelete}
				<button class="btn btn-danger" onclick={onDelete}>Delete</button>
			{/if}
		</div>
	{/if}
</div>

{#snippet saveStatusText()}
	{#if saveStatus === 'saving'}
		<span class="save-status">Saving...</span>
	{:else if saveStatus === 'saved'}
		<span class="save-status saved">Saved</span>
	{:else if saveStatus === 'error'}
		<span class="save-status error">Save failed</span>
	{/if}
{/snippet}

<style>
	.canvas-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.4rem 0.75rem;
		background-color: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		height: 40px;
		flex-shrink: 0;
		gap: 1rem;
	}

	.back-btn {
		font-size: 0.8rem;
		padding: 0.3rem 0.7rem;
		flex-shrink: 0;
	}

	.guest-banner {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.8rem;
		color: var(--text-muted);
		flex: 1;
		justify-content: flex-end;

		.btn {
			font-size: 0.75rem;
			padding: 0.3rem 0.8rem;
		}
	}

	.title-input {
		flex: 1;
		max-width: 300px;
		background: transparent;
		border: 1px solid transparent;
		padding: 0.25rem 0.5rem;
		font-size: 0.85rem;
		border-radius: 4px;
		color: var(--text-primary);

		&:hover {
			border-color: var(--border);
		}

		&:focus {
			border-color: var(--accent);
		}
	}

	.save-area {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.save-status {
		font-size: 0.75rem;
		color: var(--text-muted);

		&.saved {
			color: var(--success);
		}

		&.error {
			color: var(--danger);
		}
	}

	.save-area .btn {
		font-size: 0.75rem;
		padding: 0.3rem 0.8rem;
	}
</style>
