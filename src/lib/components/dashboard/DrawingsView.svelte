<script lang="ts">
	import { folderIcon, trashIcon } from '../icons.svelte';
	import type { DashboardHandlers, DrawingItem, ViewMode } from '$lib/dashboard/types';
	import type { Rect } from '$lib/dashboard/geometry';

	interface Props {
		viewMode: ViewMode;
		drawings: DrawingItem[];
		selectedIds: ReadonlySet<number>;
		preSelectedIds: ReadonlySet<number>;
		selectionRect: Rect | null;
		showSelectionRect: boolean;
		handlers: DashboardHandlers;
		getFolderName: (folderId: number | null) => string;
		onDrawingClick: (e: MouseEvent, drawing: DrawingItem) => void;
		onDrawingContextMenu: (e: MouseEvent, drawing: DrawingItem) => void;
	}

	let {
		viewMode,
		drawings,
		selectedIds,
		preSelectedIds,
		selectionRect,
		showSelectionRect,
		handlers,
		getFolderName,
		onDrawingClick,
		onDrawingContextMenu
	}: Props = $props();
</script>

{#if viewMode === 'grid'}
	<div class="drawings-grid">
		{#each drawings as d (d.id)}
			<button
				class="drawing-card"
				class:selected={selectedIds.has(d.id)}
				class:pre-selected={preSelectedIds.has(d.id)}
				data-drawing-id={d.id}
				onclick={(e) => onDrawingClick(e, d)}
				onkeydown={(e) => {
					if (e.key === 'Enter') handlers.openDrawing(d.id);
				}}
				oncontextmenu={(e) => onDrawingContextMenu(e, d)}
			>
				<div class="drawing-preview">
					<span class="drawing-icon">&#9998;</span>
					{@render deleteButton(d)}
				</div>
				<div class="drawing-info">
					<span class="drawing-title">{d.title}</span>
					<span class="drawing-meta">{@render folderMeta(d)}</span>
					<span class="drawing-date">{new Date(d.updatedAt).toLocaleDateString()}</span>
				</div>
			</button>
		{/each}
	</div>
{:else}
	<div class="drawings-list">
		{#if drawings.length > 0}
			<div class="list-header">
				<span class="col-name">Name</span>
				<span class="col-folder">Folder</span>
				<span class="col-date">Created</span>
				<span class="col-date">Modified</span>
			</div>
		{/if}
		{#each drawings as d (d.id)}
			<button
				class="list-row"
				class:selected={selectedIds.has(d.id)}
				class:pre-selected={preSelectedIds.has(d.id)}
				data-drawing-id={d.id}
				onclick={(e) => onDrawingClick(e, d)}
				onkeydown={(e) => {
					if (e.key === 'Enter') handlers.openDrawing(d.id);
				}}
				oncontextmenu={(e) => onDrawingContextMenu(e, d)}
			>
				<span class="col-name">
					<span class="col-name-text">{d.title}</span>
					{@render deleteButton(d)}
				</span>
				<span class="col-folder">{@render folderMeta(d)}</span>
				<span class="col-date">{new Date(d.createdAt).toLocaleDateString()}</span>
				<span class="col-date">{new Date(d.updatedAt).toLocaleDateString()}</span>
			</button>
		{/each}
	</div>
{/if}

{#if drawings.length === 0}
	<div class="empty-state">
		<p>No drawings yet.</p>
		<p>Click <strong>"New drawing"</strong> to get started!</p>
	</div>
{/if}

{#if showSelectionRect && selectionRect}
	<div
		class="selection-rect"
		style="left: {selectionRect.x}px; top: {selectionRect.y}px; width: {selectionRect.w}px; height: {selectionRect.h}px;"
	></div>
{/if}

{#snippet deleteButton(d: DrawingItem)}
	<span
		class="drawing-trash"
		role="button"
		tabindex="0"
		aria-label="Delete drawing"
		onclick={(e) => {
			e.preventDefault();
			e.stopPropagation();
			handlers.deleteDrawing(d.id);
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				handlers.deleteDrawing(d.id);
			}
		}}
	>
		{@render trashIcon(14)}
	</span>
{/snippet}

{#snippet folderMeta(d: DrawingItem)}
	{#if d.folderId != null}
		{@render folderIcon(13)}
	{/if}
	{getFolderName(d.folderId)}
{/snippet}

<style>
	.drawings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.drawing-card {
		background-color: var(--bg-secondary);
		border: 2px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		transition: border-color 0.15s;
		cursor: pointer;
		text-align: left;
		font-family: inherit;
		color: inherit;
		width: 100%;
		padding: 0;

		&:hover {
			border-color: var(--accent);
		}

		&.selected {
			border-color: var(--accent);
			box-shadow: 0 0 0 1px var(--accent);
		}

		&.pre-selected {
			border-color: rgba(105, 101, 219, 0.4);
			box-shadow: 0 0 0 1px rgba(105, 101, 219, 0.3);
		}
	}

	.drawing-preview {
		position: relative;
		height: 120px;
		background-color: var(--bg-tertiary);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.drawing-icon {
		font-size: 2rem;
		opacity: 0.3;
	}

	.drawing-trash {
		color: var(--text-muted);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 0.15s,
			color 0.15s;
	}

	.drawing-preview .drawing-trash {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
	}

	.col-name .drawing-trash {
		flex-shrink: 0;
		margin-left: 0.15rem;
		display: inline-flex;
		align-items: center;
	}

	.drawing-card:hover .drawing-trash,
	.list-row:hover .drawing-trash {
		opacity: 0.7;
	}

	.drawing-trash:hover {
		color: var(--danger);
		opacity: 1;
	}

	.drawing-info {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.drawing-title {
		font-size: 0.9rem;
		color: var(--text-primary);
		font-weight: 500;
	}

	.drawing-meta {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.drawing-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.drawings-list {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
	}

	.list-header {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		padding: 0.6rem 1rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background-color: var(--bg-secondary);
		border-bottom: 1px solid var(--border);
		gap: 0.5rem;
	}

	.list-row {
		position: relative;
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		padding: 0.65rem 1rem;
		font-size: 0.85rem;
		color: var(--text-primary);
		background-color: var(--bg-tertiary);
		border: none;
		border-bottom: 1px solid var(--border);
		text-align: left;
		font-family: inherit;
		cursor: pointer;
		transition: background-color 0.1s;
		gap: 0.5rem;
		align-items: center;

		&:last-child {
			border-bottom: none;
		}

		&:hover {
			background-color: var(--bg-hover);
		}

		&.selected {
			background-color: rgba(105, 101, 219, 0.15);
		}

		&.pre-selected {
			background-color: rgba(105, 101, 219, 0.08);
		}
	}

	.col-name {
		display: flex;
		align-items: center;
		overflow: hidden;
		min-width: 0;
	}

	.col-name-text {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
	}

	.col-folder,
	.col-date {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.selection-rect {
		position: absolute;
		border: 2px solid var(--accent);
		background-color: rgba(105, 101, 219, 0.12);
		pointer-events: none;
		z-index: 10;
		border-radius: 2px;
		top: 0;
		left: 0;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);

		p {
			margin-bottom: 0.25rem;
		}
	}
</style>
