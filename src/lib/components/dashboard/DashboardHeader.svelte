<script lang="ts">
	import type { DashboardHandlers, FolderItem, ViewMode } from '$lib/dashboard/types';

	interface Props {
		title: string;
		folders: FolderItem[];
		selectedCount: number;
		selectedHaveFolder: boolean;
		viewMode: ViewMode;
		moveFolderOpen: boolean;
		handlers: DashboardHandlers;
		onViewModeChange: (mode: ViewMode) => void;
		onToggleMoveFolder: () => void;
	}

	let {
		title,
		folders,
		selectedCount,
		selectedHaveFolder,
		viewMode,
		moveFolderOpen,
		handlers,
		onViewModeChange,
		onToggleMoveFolder
	}: Props = $props();
</script>

<div class="dashboard-header">
	<h2>{title}</h2>
	<div class="header-actions">
		{#if selectedCount > 0}
			<span class="selection-count">{selectedCount} selected</span>
			<button class="btn btn-danger" onclick={handlers.deleteSelected}>Delete</button>
			{#if folders.length > 0}
				<div class="move-folder-wrap">
					<button class="btn btn-secondary" onclick={onToggleMoveFolder}>Move to folder</button>
					{#if moveFolderOpen}
						<div class="folder-dropdown">
							{#each folders as f (f.id)}
								<button class="folder-dropdown-item" onclick={() => handlers.moveSelected(f.id)}>
									{f.name}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
			{#if selectedHaveFolder}
				<button class="btn btn-secondary" onclick={() => handlers.moveSelected(null)}>
					Remove from folder
				</button>
			{/if}
		{:else}
			{@render viewToggle()}
			<button class="btn btn-primary" onclick={handlers.newDrawing}>New drawing</button>
		{/if}
	</div>
</div>

{#snippet viewToggle()}
	<div class="view-toggle">
		<div class="pill-bg" class:right={viewMode === 'list'}></div>
		<button
			class="toggle-btn"
			class:active={viewMode === 'grid'}
			onclick={() => onViewModeChange('grid')}
		>
			Grid
		</button>
		<button
			class="toggle-btn"
			class:active={viewMode === 'list'}
			onclick={() => onViewModeChange('list')}
		>
			List
		</button>
	</div>
{/snippet}

<style>
	.dashboard-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.5rem;

		h2 {
			font-size: 1.3rem;
		}
	}

	.header-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.selection-count {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.move-folder-wrap {
		position: relative;
	}

	.folder-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 0.35rem;
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.35rem;
		min-width: 160px;
		z-index: 20;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.folder-dropdown-item {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		color: var(--text-primary);
		padding: 0.4rem 0.6rem;
		font-size: 0.8rem;
		border-radius: 4px;
		font-family: inherit;

		&:hover {
			background-color: var(--bg-hover);
		}
	}

	.view-toggle {
		display: flex;
		position: relative;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius);
		padding: 0.2rem;
		z-index: 0;
	}

	.pill-bg {
		position: absolute;
		top: 0.2rem;
		left: 0.2rem;
		height: calc(100% - 0.4rem);
		width: calc(50% - 0.2rem);
		background-color: var(--bg-primary);
		border-radius: calc(var(--radius) - 2px);
		transition: transform 0.2s ease;
		z-index: 0;
		pointer-events: none;

		&.right {
			transform: translateX(100%);
		}
	}

	.toggle-btn {
		padding: 0.35rem 0.8rem;
		font-size: 0.8rem;
		font-weight: 500;
		border: none;
		background: transparent;
		color: var(--text-muted);
		position: relative;
		z-index: 1;
		transition: color 0.15s;

		&.active {
			color: var(--text-primary);
		}

		&:hover:not(.active) {
			color: var(--text-primary);
		}
	}

	.header-actions .btn {
		font-size: 0.8rem;
		padding: 0.35rem 0.85rem;
	}
</style>
