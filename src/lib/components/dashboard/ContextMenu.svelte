<script lang="ts">
	import { resolve } from '$app/paths';
	import type {
		ContextMenuState,
		DashboardHandlers,
		DrawingItem,
		FolderItem
	} from '$lib/dashboard/types';

	interface Props {
		menu: ContextMenuState | null;
		folders: FolderItem[];
		drawings: DrawingItem[];
		selectedIds: ReadonlySet<number>;
		handlers: DashboardHandlers;
	}

	let { menu, folders, drawings, selectedIds, handlers }: Props = $props();

	let moveTargetId = $state<number | null>(null);
	let removeFolderOpen = $state(false);

	const selectionMode = $derived(
		menu?.type === 'drawing' && selectedIds.size > 0 && selectedIds.has(menu.id)
	);

	const contextDrawingHasFolder = $derived.by(() => {
		if (menu?.type !== 'drawing') return false;
		return drawings.find((d) => d.id === menu.id)?.folderId != null;
	});
</script>

{#if menu}
	<div class="context-menu" style="left: {menu.x}px; top: {menu.y}px;" role="menu">
		{#if menu.type === 'drawing'}
			{#if !selectionMode}
				<a href={resolve(`/draw/${menu.id}`)} class="context-item" role="menuitem"> Open </a>
				<button
					class="context-item"
					role="menuitem"
					onclick={() => {
						handlers.renameDrawing(menu.id, menu.title);
						handlers.close();
					}}
				>
					Rename
				</button>
			{/if}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => (moveTargetId = moveTargetId === menu.id ? null : menu.id)}
			>
				Move to folder
			</button>
			{#if moveTargetId === menu.id}
				<div class="context-menu-sub">
					<button
						class="context-item"
						role="menuitem"
						onclick={async () => {
							const id = menu.id;
							const isMulti = selectionMode;
							handlers.close();
							const name = prompt('Folder name:');
							if (!name) return;
							await handlers.createFolderAndMove(name, isMulti ? [...selectedIds] : [id]);
						}}
					>
						Create folder
					</button>
					{#if folders.length > 0}
						<div class="context-menu-divider"></div>
						{#each folders as f (f.id)}
							<button
								class="context-item"
								role="menuitem"
								onclick={() => {
									if (selectionMode) handlers.moveSelected(f.id);
									else handlers.moveDrawing(menu.id, f.id);
									handlers.close();
								}}
							>
								{f.name}
							</button>
						{/each}
					{/if}
				</div>
			{/if}
			{#if contextDrawingHasFolder}
				<button
					class="context-item"
					role="menuitem"
					onclick={() => {
						if (selectionMode) handlers.moveSelected(null);
						else handlers.moveDrawing(menu.id, null);
						handlers.close();
					}}
				>
					Remove from folder
				</button>
			{/if}
			<div class="context-menu-divider"></div>
			<button
				class="context-item context-danger"
				role="menuitem"
				onclick={async () => {
					const id = menu.id;
					handlers.close();
					await new Promise((r) => setTimeout(r, 0));
					if (selectionMode) handlers.deleteSelected();
					else handlers.deleteDrawing(id);
				}}
			>
				Delete
			</button>
		{:else if menu.type === 'folder'}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					handlers.renameFolder(menu.id, menu.title);
					handlers.close();
				}}
			>
				Rename
			</button>
			<button
				class="context-item context-danger"
				role="menuitem"
				onclick={() => {
					handlers.deleteFolder(menu.id, menu.title);
					handlers.close();
				}}
			>
				Delete
			</button>
		{:else if menu.type === 'dashboard'}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					handlers.close();
					handlers.newDrawing();
				}}
			>
				New drawing
			</button>
		{:else if menu.type === 'sidebar'}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					handlers.close();
					handlers.newFolder();
				}}
			>
				New folder
			</button>
			<div class="context-menu-divider"></div>
			{#if menu.id}
				{@const folderId = menu.id}
				{@const folderName = menu.title ?? ''}
				<button
					class="context-item context-danger"
					role="menuitem"
					onclick={() => {
						handlers.deleteFolder(folderId, folderName);
						handlers.close();
					}}
				>
					Remove folder
				</button>
			{:else}
				<button
					class="context-item context-danger"
					role="menuitem"
					onclick={() => (removeFolderOpen = !removeFolderOpen)}
				>
					Remove folder...
				</button>
				{#if removeFolderOpen}
					<div class="context-menu-sub">
						{#each folders as f (f.id)}
							<button
								class="context-item context-danger"
								role="menuitem"
								onclick={() => {
									handlers.deleteFolder(f.id, f.name);
									handlers.close();
								}}
							>
								{f.name}
							</button>
						{/each}
					</div>
				{/if}
			{/if}
		{/if}
	</div>
{/if}

<style>
	.context-menu {
		position: fixed;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.35rem;
		min-width: 150px;
		z-index: 9999;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
	}

	.context-item {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		color: var(--text-primary);
		padding: 0.45rem 0.7rem;
		font-size: 0.82rem;
		border-radius: 4px;
		font-family: inherit;
		text-decoration: none;

		&:hover {
			background-color: var(--bg-hover);
		}
	}

	.context-danger {
		color: var(--danger);

		&:hover {
			background-color: rgba(224, 108, 108, 0.15);
		}
	}

	.context-menu-divider {
		height: 1px;
		background-color: var(--border);
		margin: 0.25rem 0;
	}

	.context-menu-sub {
		padding-left: 0.75rem;
		border-left: 2px solid var(--border);
		margin-left: 0.5rem;
		margin-bottom: 0.25rem;
	}
</style>
