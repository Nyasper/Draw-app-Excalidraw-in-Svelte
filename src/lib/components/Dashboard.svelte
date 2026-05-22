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

	type ContextMenuType = 'drawing' | 'folder' | 'dashboard' | 'sidebar';
	interface ContextMenuState {
		x: number;
		y: number;
		type: ContextMenuType;
		id?: number;
		title?: string;
	}

	const DRAG_THRESHOLD = 5;

	let { folders = [], drawings = [], selectedFolderId = null, message = '' }: Props = $props();

	let viewMode: 'grid' | 'list' = $state('grid');
	let selectedIds = new SvelteSet<number>();
	let preSelectedIds = new SvelteSet<number>();
	let isDragging = $state(false);
	let hasMovedEnough = $state(false);
	let selectionRect: { x: number; y: number; w: number; h: number } | null = $state(null);
	let areaEl: HTMLElement | null = $state(null);
	let dragStart = $state({ x: 0, y: 0 });
	let lastClickedId: number | null = $state(null);
	let contextMenu: ContextMenuState | null = $state(null);
	let moveFolderOpen = $state(false);
	let moveTargetId: number | null = $state(null);
	let removeFolderOpen = $state(false);
	let dragJustEnded = $state(false);

	const selectedCount = $derived(selectedIds.size);
	const anySelectedHasFolder = $derived(
		[...selectedIds].some((id) => drawings.find((d) => d.id === id)?.folderId != null)
	);
	const contextDrawingHasFolder = $derived.by(() => {
		const menu = contextMenu;
		if (!menu || menu.type !== 'drawing' || menu.id == null) return false;
		const drawing = drawings.find((d) => d.id === menu.id);
		return drawing?.folderId != null;
	});

	const isSelectionMenu = $derived.by(() => {
		const menu = contextMenu;
		if (!menu || menu.type !== 'drawing' || menu.id == null || selectedIds.size === 0) return false;
		return selectedIds.has(menu.id);
	});

	function clampToViewport(x: number, y: number, menuW = 160, menuH = 120) {
		return {
			x: Math.max(0, Math.min(x, window.innerWidth - menuW)),
			y: Math.max(0, Math.min(y, window.innerHeight - menuH))
		};
	}

	function getFolderName(folderId: number | null) {
		if (folderId === null) return 'no folder';
		return folders.find((f) => f.id === folderId)?.name ?? 'no folder';
	}

	function getFolderDrawingCount(folderId: number) {
		return drawings.filter((d) => d.folderId === folderId).length;
	}

	function toggleSelection(itemId: number, ctrl: boolean, shift: boolean) {
		if (shift && lastClickedId !== null) {
			const ids = drawings.map((d) => d.id);
			const startIdx = ids.indexOf(lastClickedId);
			const endIdx = ids.indexOf(itemId);
			if (startIdx === -1 || endIdx === -1) return;
			const range = ids.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
			if (!ctrl) selectedIds.clear();
			for (const id of range) selectedIds.add(id);
		} else if (ctrl) {
			if (selectedIds.has(itemId)) selectedIds.delete(itemId);
			else selectedIds.add(itemId);
		} else {
			selectedIds.clear();
			selectedIds.add(itemId);
		}
		lastClickedId = itemId;
	}

	function handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('a') || target.closest('input')) return;
		const isDrawingEl = target.closest('[data-drawing-id]');
		if (!isDrawingEl && target.closest('button')) return;
		if (!areaEl) return;

		e.preventDefault();

		const rect = areaEl.getBoundingClientRect();
		dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		isDragging = true;
		hasMovedEnough = false;
		dragJustEnded = false;
		preSelectedIds.clear();

		const onMouseMove = (ev: MouseEvent) => {
			if (!areaEl) return;
			const r = areaEl.getBoundingClientRect();
			const cx = ev.clientX - r.left;
			const cy = ev.clientY - r.top;
			const dx = Math.abs(cx - dragStart.x);
			const dy = Math.abs(cy - dragStart.y);

			if (!hasMovedEnough && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
				hasMovedEnough = true;
				if (!e.ctrlKey && !e.shiftKey) selectedIds.clear();
			}

			if (hasMovedEnough) {
				selectionRect = {
					x: Math.min(dragStart.x, cx),
					y: Math.min(dragStart.y, cy),
					w: dx,
					h: dy
				};
				updatePreSelection(selectionRect);
			}
		};

		const onMouseUp = () => {
			handleMouseUp();
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	function updatePreSelection(sr: { x: number; y: number; w: number; h: number }) {
		if (!areaEl) return;
		preSelectedIds.clear();
		const items = areaEl.querySelectorAll('[data-drawing-id]');
		const areaRect = areaEl.getBoundingClientRect();

		items.forEach((el) => {
			const itemRect = el.getBoundingClientRect();
			const ix = itemRect.left - areaRect.left;
			const iy = itemRect.top - areaRect.top;
			const iw = itemRect.width;
			const ih = itemRect.height;

			const intersects = ix < sr.x + sr.w && ix + iw > sr.x && iy < sr.y + sr.h && iy + ih > sr.y;

			if (intersects) {
				const drawingId = Number(el.getAttribute('data-drawing-id'));
				preSelectedIds.add(drawingId);
			}
		});
	}

	function handleMouseUp() {
		if (!hasMovedEnough) {
			isDragging = false;
			selectionRect = null;
			preSelectedIds.clear();
			return;
		}

		dragJustEnded = true;
		for (const id of preSelectedIds) {
			selectedIds.add(id);
		}
		preSelectedIds.clear();
		isDragging = false;
		selectionRect = null;
	}

	function clearSelection() {
		selectedIds.clear();
	}

	$effect(() => {
		const onAnyClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (contextMenu && !target.closest('.context-menu')) {
				contextMenu = null;
				moveTargetId = null;
				removeFolderOpen = false;
			}
			if (moveFolderOpen && !target.closest('.move-folder-wrap')) {
				moveFolderOpen = false;
			}
		};
		window.addEventListener('click', onAnyClick);
		return () => window.removeEventListener('click', onAnyClick);
	});

	function openDrawingMenu(e: MouseEvent, d: DrawingItem) {
		e.preventDefault();
		e.stopPropagation();
		moveTargetId = null;
		const pos = clampToViewport(e.clientX, e.clientY);
		contextMenu = { ...pos, type: 'drawing', id: d.id, title: d.title };
	}

	function openFolderMenu(e: MouseEvent, f: FolderItem) {
		e.preventDefault();
		e.stopPropagation();
		const pos = clampToViewport(e.clientX, e.clientY);
		contextMenu = { ...pos, type: 'folder', id: f.id, title: f.name };
	}

	function openDashboardMenu(e: MouseEvent) {
		e.preventDefault();
		const pos = clampToViewport(e.clientX, e.clientY, 180, 50);
		contextMenu = { ...pos, type: 'dashboard' };
	}

	function openSidebarMenu(e: MouseEvent) {
		e.preventDefault();
		removeFolderOpen = false;
		const pos = clampToViewport(e.clientX, e.clientY, 200, 80);
		const folder = selectedFolderId ? folders.find((f) => f.id === selectedFolderId) : null;
		contextMenu = {
			...pos,
			type: 'sidebar',
			id: folder?.id,
			title: folder?.name
		};
	}

	async function deleteSelected() {
		if (selectedIds.size === 0) return;
		let msg: string;
		if (selectedIds.size === 1) {
			const id = [...selectedIds][0];
			const drawing = drawings.find((d) => d.id === id);
			msg = `Delete "${drawing?.title ?? 'Untitled'}"?`;
		} else {
			msg = `Delete ${selectedIds.size} drawing(s)?`;
		}

		if (!confirm(msg)) return;

		for (const id of selectedIds) {
			await fetch(resolve(`/draw/${id}`), { method: 'DELETE' }).catch(() => {});
		}
		window.location.reload();
	}

	async function moveSelectedToFolder(folderId: number | null) {
		for (const id of selectedIds) {
			await fetch(resolve(`/draw/${id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ folderId })
			}).catch(() => {});
		}
		window.location.reload();
	}

	async function moveDrawingToFolder(drawingId: number, folderId: number | null) {
		await fetch(resolve(`/draw/${drawingId}`), {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ folderId })
		})
			.then(() => window.location.reload())
			.catch(() => {});
	}

	async function deleteDrawing(id: number) {
		const drawing = drawings.find((d) => d.id === id);
		if (!confirm(`Delete "${drawing?.title ?? 'Untitled'}"?`)) return;
		await fetch(resolve(`/draw/${id}`), { method: 'DELETE' }).catch(() => {});
		window.location.reload();
	}

	async function renameFolder(id: number, newName: string) {
		await fetch(resolve(`/folders/${id}`), {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: newName })
		})
			.then(() => window.location.reload())
			.catch(() => {});
	}

	async function deleteFolder(id: number, name: string) {
		const count = getFolderDrawingCount(id);
		let msg = `Delete folder "${name}"?`;
		if (count > 0) {
			msg += ` It contains ${count} drawing${count !== 1 ? 's' : ''}.`;
		}
		if (!confirm(msg)) return;

		if (
			count > 0 &&
			confirm(`Also delete the ${count} drawing${count !== 1 ? 's' : ''} inside "${name}"?`)
		) {
			const folderDrawings = drawings.filter((d) => d.folderId === id);
			for (const d of folderDrawings) {
				await fetch(resolve(`/draw/${d.id}`), { method: 'DELETE' }).catch(() => {});
			}
		}

		await fetch(resolve(`/folders/${id}`), { method: 'DELETE' })
			.then(() => {
				if (id === selectedFolderId) {
					window.location.href = resolve('/');
				} else {
					window.location.reload();
				}
			})
			.catch(() => {});
	}

	async function createNewDrawing() {
		const title = prompt('Drawing title:', 'Untitled');
		if (!title) return;
		const body: { title: string; folderId?: number } = { title };
		if (selectedFolderId != null) body.folderId = selectedFolderId;
		await fetch(resolve('/draw'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		})
			.then((r) => r.json())
			.then((d) => {
				window.location.href = resolve(`/draw/${d.id}`);
			})
			.catch(() => {});
	}

	async function createNewFolder() {
		const name = prompt('Folder name:');
		if (!name) return;
		await fetch(resolve('/folders'), {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name })
		})
			.then(() => window.location.reload())
			.catch(() => {});
	}
</script>

<div class="dashboard">
	<aside class="sidebar">
		<a href={resolve('/')} class:active={selectedFolderId === null} class="sidebar-all-link">
			All drawings
		</a>
		<h2 class="folders-heading">Folders</h2>
		<nav class="folder-list" oncontextmenu={(e) => openSidebarMenu(e)}>
			{#each folders as f (f.id)}
				<a
					href={resolve(`/?folder=${f.id}`)}
					class:active={selectedFolderId === f.id}
					class="folder-item"
					oncontextmenu={(e) => openFolderMenu(e, f)}
				>
					{@render folderIcon(14)}
					<span class="folder-item-name">{f.name}</span>
					<button
						class="folder-trash"
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							deleteFolder(f.id, f.name);
						}}
						aria-label="Delete folder"
					>
						{@render trashIcon(14)}
					</button>
				</a>
			{:else}
				<p class="folder-empty">No folders yet.</p>
			{/each}
		</nav>
		<form method="post" action="?/createFolder" use:enhance class="new-folder-form">
			<input type="text" name="folderName" placeholder="New folder..." required />
			<button class="btn btn-primary" type="submit">+</button>
		</form>
	</aside>

	<main class="dashboard-main" oncontextmenu={(e) => openDashboardMenu(e)}>
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
					{#if folders.length > 0}
						<div class="move-folder-wrap">
							<button class="btn btn-secondary" onclick={() => (moveFolderOpen = !moveFolderOpen)}>
								Move to folder
							</button>
							{#if moveFolderOpen}
								<div class="folder-dropdown">
									{#each folders as f (f.id)}
										<button
											class="folder-dropdown-item"
											onclick={() => {
												moveSelectedToFolder(f.id);
												moveFolderOpen = false;
											}}
										>
											{f.name}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
					{#if anySelectedHasFolder}
						<button class="btn btn-secondary" onclick={() => moveSelectedToFolder(null)}>
							Remove from folder
						</button>
					{/if}
				{:else}
					<div class="view-toggle">
						<div class="pill-bg" class:right={viewMode === 'list'}></div>
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
					<button class="btn btn-primary" onclick={createNewDrawing}>New drawing</button>
				{/if}
			</div>
		</div>

		{#if message}
			<p class="error">{message}</p>
		{/if}

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="drawings-area"
			bind:this={areaEl}
			onmousedown={handleMouseDown}
			onclick={(e) => {
				if (dragJustEnded) {
					dragJustEnded = false;
					return;
				}
				if (selectedIds.size > 0 && !(e.target as HTMLElement).closest('[data-drawing-id]')) {
					clearSelection();
				}
			}}
			onkeydown={(e) => {
				if (e.key === 'Escape' || e.key === 'Enter') clearSelection();
			}}
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
							class:pre-selected={preSelectedIds.has(d.id)}
							data-drawing-id={d.id}
							onclick={(e) => {
								e.preventDefault();
								if (dragJustEnded) {
									dragJustEnded = false;
									return;
								}
								if (e.ctrlKey || e.shiftKey) {
									toggleSelection(d.id, e.ctrlKey, e.shiftKey);
								} else {
									window.location.href = resolve(`/draw/${d.id}`);
								}
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') window.location.href = resolve(`/draw/${d.id}`);
							}}
							oncontextmenu={(e) => openDrawingMenu(e, d)}
						>
							<div class="drawing-preview">
								<span class="drawing-icon">&#9998;</span>
								<span
									class="drawing-trash"
									role="button"
									tabindex="0"
									aria-label="Delete drawing"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										deleteDrawing(d.id);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											e.stopPropagation();
											deleteDrawing(d.id);
										}
									}}
								>
									{@render trashIcon(14)}
								</span>
							</div>
							<div class="drawing-info">
								<span class="drawing-title">{d.title}</span>
								<span class="drawing-meta">
									{#if d.folderId != null}
										{@render folderIcon(13)}
									{/if}
									{getFolderName(d.folderId)}
								</span>
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
							onclick={(e) => {
								e.preventDefault();
								if (dragJustEnded) {
									dragJustEnded = false;
									return;
								}
								if (e.ctrlKey || e.shiftKey) {
									toggleSelection(d.id, e.ctrlKey, e.shiftKey);
								} else {
									window.location.href = resolve(`/draw/${d.id}`);
								}
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter') window.location.href = resolve(`/draw/${d.id}`);
							}}
							oncontextmenu={(e) => openDrawingMenu(e, d)}
						>
							<span class="col-name">
								<span class="col-name-text">{d.title}</span>
								<span
									class="drawing-trash"
									role="button"
									tabindex="0"
									aria-label="Delete drawing"
									onclick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										deleteDrawing(d.id);
									}}
									onkeydown={(e) => {
										if (e.key === 'Enter') {
											e.preventDefault();
											e.stopPropagation();
											deleteDrawing(d.id);
										}
									}}
								>
									{@render trashIcon(14)}
								</span>
							</span>
							<span class="col-folder">
								{#if d.folderId != null}
									{@render folderIcon(13)}
								{/if}
								{getFolderName(d.folderId)}
							</span>
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

			{#if isDragging && hasMovedEnough && selectionRect}
				<div
					class="selection-rect"
					style="left: {selectionRect.x}px; top: {selectionRect.y}px; width: {selectionRect.w}px; height: {selectionRect.h}px;"
				></div>
			{/if}
		</div>
	</main>
</div>

{#if contextMenu}
	<div class="context-menu" style="left: {contextMenu.x}px; top: {contextMenu.y}px;" role="menu">
		{#if contextMenu.type === 'drawing'}
			{#if !isSelectionMenu}
				<a href={resolve(`/draw/${contextMenu.id}`)} class="context-item" role="menuitem"> Open </a>
				<button
					class="context-item"
					role="menuitem"
					onclick={() => {
						const ctx = contextMenu!;
						if (ctx.type !== 'drawing') return;
						const newTitle = prompt('Rename drawing:', ctx.title);
						if (newTitle && newTitle !== ctx.title) {
							fetch(resolve(`/draw/${ctx.id}`), {
								method: 'PUT',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ title: newTitle })
							})
								.then(() => window.location.reload())
								.catch(() => {});
						}
						contextMenu = null;
					}}
				>
					Rename
				</button>
			{/if}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					const ctx = contextMenu!;
					if (ctx.type !== 'drawing') return;
					moveTargetId = moveTargetId === ctx.id ? null : ctx.id!;
				}}
			>
				Move to folder
			</button>
			{#if moveTargetId === contextMenu.id}
				<div class="context-menu-sub">
					<button
						class="context-item"
						role="menuitem"
						onclick={async () => {
							const isMulti = isSelectionMenu;
							const ctx = contextMenu!;
							contextMenu = null;
							moveTargetId = null;
							const name = prompt('Folder name:');
							if (!name) return;
							const res = await fetch(resolve('/folders'), {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({ name })
							});
							const folder = await res.json();
							if (isMulti) {
								for (const id of selectedIds) {
									await fetch(resolve(`/draw/${id}`), {
										method: 'PUT',
										headers: { 'Content-Type': 'application/json' },
										body: JSON.stringify({ folderId: folder.id })
									}).catch(() => {});
								}
							} else {
								await fetch(resolve(`/draw/${ctx.id!}`), {
									method: 'PUT',
									headers: { 'Content-Type': 'application/json' },
									body: JSON.stringify({ folderId: folder.id })
								}).catch(() => {});
							}
							window.location.reload();
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
									const ctx = contextMenu!;
									if (ctx.type !== 'drawing') return;
									if (isSelectionMenu) {
										moveSelectedToFolder(f.id);
									} else {
										moveDrawingToFolder(ctx.id!, f.id);
									}
									moveTargetId = null;
									contextMenu = null;
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
						const ctx = contextMenu!;
						if (ctx.type !== 'drawing') return;
						if (isSelectionMenu) {
							moveSelectedToFolder(null);
						} else {
							moveDrawingToFolder(ctx.id!, null);
						}
						moveTargetId = null;
						contextMenu = null;
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
					const ctx = contextMenu!;
					if (ctx.type !== 'drawing') return;
					const isMulti = isSelectionMenu;
					contextMenu = null;
					await new Promise((r) => setTimeout(r, 0));
					if (isMulti) {
						deleteSelected();
					} else {
						deleteDrawing(ctx.id!);
					}
				}}
			>
				Delete
			</button>
		{:else if contextMenu.type === 'folder'}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					const ctx = contextMenu!;
					if (ctx.type !== 'folder') return;
					const newName = prompt('Rename folder:', ctx.title);
					if (newName && newName !== ctx.title) {
						renameFolder(ctx.id!, newName);
					}
					contextMenu = null;
				}}
			>
				Rename
			</button>
			<button
				class="context-item context-danger"
				role="menuitem"
				onclick={() => {
					const ctx = contextMenu!;
					if (ctx.type !== 'folder') return;
					deleteFolder(ctx.id!, ctx.title ?? '');
					contextMenu = null;
				}}
			>
				Delete
			</button>
		{:else if contextMenu.type === 'dashboard'}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					contextMenu = null;
					createNewDrawing();
				}}
			>
				New drawing
			</button>
		{:else if contextMenu.type === 'sidebar'}
			<button
				class="context-item"
				role="menuitem"
				onclick={() => {
					contextMenu = null;
					createNewFolder();
				}}
			>
				New folder
			</button>
			<div class="context-menu-divider"></div>
			{#if contextMenu.id}
				<button
					class="context-item context-danger"
					role="menuitem"
					onclick={() => {
						const ctx = contextMenu!;
						if (ctx.type !== 'sidebar') return;
						deleteFolder(ctx.id!, ctx.title ?? '');
						contextMenu = null;
					}}
				>
					Remove folder
				</button>
			{:else}
				<button
					class="context-item context-danger"
					role="menuitem"
					onclick={() => {
						removeFolderOpen = !removeFolderOpen;
					}}
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
									deleteFolder(f.id, f.name);
									contextMenu = null;
									removeFolderOpen = false;
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

<!-- Snippets -->

{#snippet trashIcon(size: number)}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path
			d="M9 3H15M3 6H21M19 6L18.2987 16.5193C18.1935 18.0975 18.1409 18.8867 17.8 19.485C17.4999 20.0118 17.0472 20.4353 16.5017 20.6997C15.882 21 15.0911 21 13.5093 21H10.4907C8.90891 21 8.11803 21 7.49834 20.6997C6.95276 20.4353 6.50009 20.0118 6.19998 19.485C5.85911 18.8867 5.8065 18.0975 5.70129 16.5193L5 6"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

{#snippet folderIcon(size: number)}
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="folder-icon"
	>
		<path
			d="M3 8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H9.67452C10.1637 5 10.4083 5 10.6385 5.05526C10.8425 5.10425 11.0376 5.18506 11.2166 5.29472C11.4184 5.4184 11.5914 5.59135 11.9373 5.93726L12.0627 6.06274C12.4086 6.40865 12.5816 6.5816 12.7834 6.70528C12.9624 6.81494 13.1575 6.89575 13.3615 6.94474C13.5917 7 13.8363 7 14.3255 7H17.8C18.9201 7 19.4802 7 19.908 7.21799C20.2843 7.40973 20.5903 7.71569 20.782 8.09202C21 8.51984 21 9.0799 21 10.2V15.8C21 16.9201 21 17.4802 20.782 17.908C20.5903 18.2843 20.2843 18.5903 19.908 18.782C19.4802 19 18.9201 19 17.8 19H6.2C5.07989 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2Z"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
{/snippet}

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

	.folder-icon {
		flex-shrink: 0;
		color: var(--text-muted);
		margin-right: 0.35rem;
		vertical-align: middle;
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

	.dashboard-main {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		user-select: none;
		display: flex;
		flex-direction: column;
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
		flex: 1;
		min-height: 0;
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

	.col-name .drawing-trash svg {
		display: block;
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
