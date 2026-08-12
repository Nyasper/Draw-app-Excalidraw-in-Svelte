<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { folderIcon, trashIcon } from '../icons.svelte';
	import { loading } from '$lib/loading.svelte';
	import Spinner from '../Spinner.svelte';
	import type { DashboardHandlers, FolderItem } from '$lib/dashboard/types';

	interface Props {
		folders: FolderItem[];
		selectedFolderId: number | null;
		handlers: DashboardHandlers;
		onFolderContextMenu: (e: MouseEvent, folder: FolderItem) => void;
		onSidebarContextMenu: (e: MouseEvent) => void;
	}

	let {
		folders,
		selectedFolderId = null,
		handlers,
		onFolderContextMenu,
		onSidebarContextMenu
	}: Props = $props();
</script>

<aside class="sidebar">
	<a href={resolve('/')} class:active={selectedFolderId === null} class="sidebar-all-link">
		All drawings
	</a>
	<h2 class="folders-heading">Folders</h2>
	<nav class="folder-list" oncontextmenu={(e) => onSidebarContextMenu(e)}>
		{#each folders as f (f.id)}
			<a
				href={resolve(`/?folder=${f.id}`)}
				class:active={selectedFolderId === f.id}
				class="folder-item"
				oncontextmenu={(e) => onFolderContextMenu(e, f)}
			>
				{@render folderIcon(14)}
				<span class="folder-item-name">{f.name}</span>
				<button
					class="folder-trash"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						handlers.deleteFolder(f.id, f.name);
					}}
					aria-label="Delete folder"
				>
					{#if loading.isPending(`folder:${f.id}`)}
						<Spinner size={14} />
					{:else}
						{@render trashIcon(14)}
					{/if}
				</button>
			</a>
		{:else}
			<p class="folder-empty">No folders yet.</p>
		{/each}
	</nav>
	<form
		method="post"
		action="?/createFolder"
		use:enhance={() => {
			loading.startKey('folder-new');
			return async ({ update }) => {
				await update();
				loading.stopKey('folder-new');
			};
		}}
		class="new-folder-form"
	>
		<input type="text" name="folderName" placeholder="New folder..." required />
		<button class="btn btn-primary" type="submit" disabled={loading.isPending('folder-new')}>
			{#if loading.isPending('folder-new')}
				<Spinner size={14} />
			{:else}
				+
			{/if}
		</button>
	</form>
</aside>

<style>
	.sidebar {
		width: 220px;
		background-color: var(--bg-secondary);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 0.75rem;
		flex-shrink: 0;
		overflow: hidden;
	}

	.sidebar-all-link {
		display: flex;
		align-items: center;
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--text-primary);
		font-weight: 500;
		transition: background-color 0.15s;
		text-decoration: none;
		margin-bottom: 0.5rem;

		&:hover {
			background-color: var(--bg-hover);
		}

		&.active {
			background-color: var(--accent);
			color: white;
		}
	}

	.folders-heading {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		margin: 0.5rem 0 0.25rem;
	}

	.folder-list {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.folder-item {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--text-muted);
		transition: background-color 0.15s;
		text-decoration: none;

		&:hover {
			background-color: var(--bg-hover);
			color: var(--text-primary);
		}

		&.active {
			background-color: var(--accent);
			color: white;
		}
	}

	.folder-item-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		flex: 1;
		min-width: 0;
	}

	.folder-trash {
		opacity: 0;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.1rem 0.2rem;
		border-radius: 3px;
		transition:
			opacity 0.15s,
			color 0.15s,
			background-color 0.15s;
		flex-shrink: 0;
		line-height: 1;
		color: var(--text-muted);

		.folder-item:hover & {
			opacity: 1;
		}

		&:hover {
			color: var(--danger);
			background-color: rgba(224, 108, 108, 0.15);
		}

		.folder-item.active & {
			opacity: 1;
			color: #f28b8b;

			&:hover {
				color: #ff6b6b;
				background-color: rgba(255, 107, 107, 0.2);
			}
		}
	}

	.folder-empty {
		font-size: 0.75rem;
		color: var(--text-muted);
		padding: 0.4rem 0.6rem;
		opacity: 0.7;
	}

	.new-folder-form {
		display: flex;
		gap: 0.35rem;
		margin-top: auto;

		input {
			flex: 1;
			font-size: 0.8rem;
			padding: 0.35rem 0.5rem;
			min-width: 0;
		}

		.btn {
			padding: 0.35rem 0.6rem;
			font-size: 0.8rem;
		}
	}
</style>
