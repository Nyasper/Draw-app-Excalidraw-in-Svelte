<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	interface DrawingItem {
		id: number;
		title: string;
		folderId: number | null;
		createdAt: Date;
		updatedAt: Date;
	}

	interface FolderItem {
		id: number;
		name: string;
		createdAt: Date;
		parentFolderId: number | null;
	}

	interface Props {
		folders: FolderItem[];
		drawings: DrawingItem[];
		selectedFolderId: number | null;
		message?: string;
	}

	let { folders = [], drawings = [], selectedFolderId = null, message = '' }: Props = $props();

	let viewMode = $state<'grid' | 'list'>('grid');
	let selectedIds = new SvelteSet<number>();
	let isDragging = $state(false);
	let selectionRect = $state<{ x: number; y: number; w: number; h: number } | null>(null);
	let containerEl: HTMLElement | null = $state(null);
	let dragStart = $state({ x: 0, y: 0 });
	let lastClickedId = $state<number | null>(null);
	let sidebarOpen = $state(true);

	const selectedCount = $derived(selectedIds.size);

	function getFolderName(folderId: number | null) {
		if (folderId === null) return '—';
		return folders.find((f) => f.id === folderId)?.name ?? '—';
	}

	function toggleSelection(itemId: number, ctrl: boolean, shift: boolean) {
		const newSelection = new SvelteSet(selectedIds);

		if (shift && lastClickedId !== null) {
			const ids = drawings.map((d) => d.id);
			const startIdx = ids.indexOf(lastClickedId);
			const endIdx = ids.indexOf(itemId);
			if (startIdx === -1 || endIdx === -1) return;
			const range = ids.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
			if (ctrl) {
				for (const id of range) newSelection.add(id);
			} else {
				newSelection.clear();
				for (const id of range) newSelection.add(id);
			}
		} else if (ctrl) {
			if (newSelection.has(itemId)) newSelection.delete(itemId);
			else newSelection.add(itemId);
		} else {
			newSelection.clear();
			newSelection.add(itemId);
		}

		selectedIds = newSelection;
		lastClickedId = itemId;
	}

	function handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('a') || target.closest('button') || target.closest('input')) return;
		if (!containerEl) return;

		const rect = containerEl.getBoundingClientRect();
		dragStart = {
			x: e.clientX - rect.left + containerEl.scrollLeft,
			y: e.clientY - rect.top + containerEl.scrollTop
		};
		isDragging = true;
		selectionRect = { x: dragStart.x, y: dragStart.y, w: 0, h: 0 };

		if (!e.ctrlKey && !e.shiftKey) {
			selectedIds = new SvelteSet();
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (!isDragging || !containerEl) return;

		const rect = containerEl.getBoundingClientRect();
		const cx = e.clientX - rect.left + containerEl.scrollLeft;
		const cy = e.clientY - rect.top + containerEl.scrollTop;

		selectionRect = {
			x: Math.min(dragStart.x, cx),
			y: Math.min(dragStart.y, cy),
			w: Math.abs(cx - dragStart.x),
			h: Math.abs(cy - dragStart.y)
		};
	}

	function handleMouseUp() {
		if (!isDragging || !selectionRect || !containerEl) {
			isDragging = false;
			selectionRect = null;
			return;
		}

		const items = containerEl.querySelectorAll('[data-drawing-id]');
		const newSelection = new SvelteSet(selectedIds);
		const sr = selectionRect;
		const containerRect = containerEl.getBoundingClientRect();

		items.forEach((el) => {
			const itemRect = el.getBoundingClientRect();
			const ix = itemRect.left - containerRect.left + containerEl!.scrollLeft;
			const iy = itemRect.top - containerRect.top + containerEl!.scrollTop;
			const iw = itemRect.width;
			const ih = itemRect.height;

			const intersects = ix < sr.x + sr.w && ix + iw > sr.x && iy < sr.y + sr.h && iy + ih > sr.y;

			if (intersects) {
				const drawingId = Number(el.getAttribute('data-drawing-id'));
				newSelection.add(drawingId);
			}
		});

		selectedIds = newSelection;
		isDragging = false;
		selectionRect = null;
	}

	function clearSelection() {
		selectedIds = new SvelteSet();
	}

	$effect(() => {
		const up = () => isDragging && handleMouseUp();
		window.addEventListener('mouseup', up);
		return () => window.removeEventListener('mouseup', up);
	});

	async function deleteSelected() {
		if (selectedIds.size === 0) return;
		if (!confirm(`Delete ${selectedIds.size} drawing(s)?`)) return;

		for (const id of selectedIds) {
			await fetch(resolve(`/draw/${id}`), { method: 'DELETE' }).catch(() => {});
		}
		window.location.reload();
	}
</script>

<div class="dashboard">
	<aside class="sidebar" class:collapsed={!sidebarOpen}>
		<div class="sidebar-header">
			<h2>Folders</h2>
			<button class="sidebar-toggle" onclick={() => (sidebarOpen = !sidebarOpen)}>
				{sidebarOpen ? '\u00AB' : '\u00BB'}
			</button>
		</div>
		{#if sidebarOpen}
			<nav class="folder-list">
				<a href={resolve('/')} class:active={selectedFolderId === null} class="folder-item">
					All drawings
				</a>
				{#each folders as f (f.id)}
					<a
						href={resolve(`/?folder=${f.id}`)}
						class:active={selectedFolderId === f.id}
						class="folder-item"
					>
						{f.name}
					</a>
				{/each}
			</nav>
			<form method="post" action="?/createFolder" use:enhance class="new-folder-form">
				<input type="text" name="folderName" placeholder="New folder..." required />
				<button class="btn btn-primary" type="submit">+</button>
			</form>
		{/if}
	</aside>

	<main class="dashboard-main" bind:this={containerEl}>
		<div class="dashboard-header">
			<h2>
				{selectedFolderId
					? (folders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder')
					: 'All drawings'}
			</h2>
			<div class="header-actions">
				{#if selectedCount > 0}
					<span class="selection-count">{selectedCount} selected</span>
					<button class="btn btn-danger" onclick={deleteSelected}>Delete</button>
					<button class="btn btn-secondary" onclick={clearSelection}>Clear</button>
				{:else}
					<div class="view-toggle">
						<button
							class="toggle-btn"
							class:active={viewMode === 'grid'}
							onclick={() => (viewMode = 'grid')}
						>
							Grid
						</button>
						<button
							class="toggle-btn"
							class:active={viewMode === 'list'}
							onclick={() => (viewMode = 'list')}
						>
							List
						</button>
					</div>
					<a href={resolve('/draw')} class="btn btn-primary">New drawing</a>
				{/if}
			</div>
		</div>

		{#if message}
			<p class="error">{message}</p>
		{/if}

		<div
			class="drawings-area"
			class:grid={viewMode === 'grid'}
			class:list={viewMode === 'list'}
			onmousemove={handleMouseMove}
			onmousedown={handleMouseDown}
			role="application"
			aria-label="Drawings selection area"
			tabindex="-1"
		>
			{#if viewMode === 'grid'}
				<div class="drawings-grid">
					{#each drawings as d (d.id)}
						<button
							class="drawing-card"
							class:selected={selectedIds.has(d.id)}
							data-drawing-id={d.id}
							onclick={(e) => {
								e.preventDefault();
								toggleSelection(d.id, e.ctrlKey, e.shiftKey);
							}}
							ondblclick={() => {
								window.location.href = resolve(`/draw/${d.id}`);
							}}
						>
							<div class="drawing-preview">
								<span class="drawing-icon">&#9998;</span>
							</div>
							<div class="drawing-info">
								<span class="drawing-title">{d.title}</span>
								<span class="drawing-meta">{getFolderName(d.folderId)}</span>
								<span class="drawing-date">{new Date(d.updatedAt).toLocaleDateString()}</span>
							</div>
						</button>
					{/each}
				</div>
			{:else}
				<div class="drawings-list">
					<div class="list-header">
						<span class="col-name">Name</span>
						<span class="col-folder">Folder</span>
						<span class="col-date">Created</span>
						<span class="col-date">Modified</span>
					</div>
					{#each drawings as d (d.id)}
						<button
							class="list-row"
							class:selected={selectedIds.has(d.id)}
							data-drawing-id={d.id}
							onclick={(e) => {
								e.preventDefault();
								toggleSelection(d.id, e.ctrlKey, e.shiftKey);
							}}
							ondblclick={() => {
								window.location.href = resolve(`/draw/${d.id}`);
							}}
						>
							<span class="col-name">{d.title}</span>
							<span class="col-folder">{getFolderName(d.folderId)}</span>
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

			{#if isDragging && selectionRect}
				<div
					class="selection-rect"
					style="left: {selectionRect.x}px; top: {selectionRect.y}px; width: {selectionRect.w}px; height: {selectionRect.h}px;"
				></div>
			{/if}
		</div>
	</main>
</div>

<style>
	.dashboard {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.sidebar {
		width: 220px;
		background-color: var(--bg-secondary);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		padding: 1rem;
		gap: 0.75rem;
		flex-shrink: 0;
		transition: width 0.2s;

		&.collapsed {
			width: 44px;
			padding: 0.5rem;
		}
	}

	.sidebar-header {
		display: flex;
		align-items: center;
		justify-content: space-between;

		h2 {
			font-size: 0.8rem;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			color: var(--text-muted);
		}
	}

	.sidebar-toggle {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 1rem;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;

		&:hover {
			background-color: var(--bg-hover);
			color: var(--text-primary);
		}
	}

	.folder-list {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.folder-item {
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--text-muted);
		transition: background-color 0.15s;

		&:hover {
			background-color: var(--bg-hover);
			color: var(--text-primary);
		}

		&.active {
			background-color: var(--accent);
			color: white;
		}
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

	.dashboard-main {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		user-select: none;
	}

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

	.view-toggle {
		display: flex;
		background-color: var(--bg-tertiary);
		border-radius: var(--radius);
		padding: 0.2rem;
	}

	.toggle-btn {
		padding: 0.35rem 0.8rem;
		font-size: 0.8rem;
		font-weight: 500;
		border: none;
		border-radius: calc(var(--radius) - 2px);
		background: transparent;
		color: var(--text-muted);
		transition: all 0.15s;

		&.active {
			background-color: var(--bg-primary);
			color: var(--text-primary);
		}

		&:hover:not(.active) {
			color: var(--text-primary);
		}
	}

	.selection-count {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.header-actions .btn {
		font-size: 0.8rem;
		padding: 0.35rem 0.85rem;
	}

	.error {
		color: var(--danger);
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	.drawings-area {
		position: relative;
	}

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
	}

	.drawing-preview {
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
	}

	.col-name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
