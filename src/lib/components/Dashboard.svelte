<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import type { Attachment } from 'svelte/attachments';
	import { resolve } from '$app/paths';
	import { goto, invalidateAll } from '$app/navigation';
	import { toggleSelection as toggleSelectionState } from '$lib/selection';
	import {
		clampToViewport,
		rectsIntersect,
		selectionRectFromPoints,
		type Point,
		type Rect
	} from '$lib/dashboard/geometry';
	import * as api from '$lib/dashboard/actions';
	import DashboardHeader from './dashboard/DashboardHeader.svelte';
	import DashboardSidebar from './dashboard/DashboardSidebar.svelte';
	import DrawingsView from './dashboard/DrawingsView.svelte';
	import ContextMenu from './dashboard/ContextMenu.svelte';
	import type {
		ContextMenuState,
		DashboardHandlers,
		DrawingItem,
		FolderItem,
		ViewMode
	} from '$lib/dashboard/types';

	interface Props {
		folders: FolderItem[];
		drawings: DrawingItem[];
		selectedFolderId: number | null;
		message?: string;
	}

	const DRAG_THRESHOLD = 5;

	let { folders = [], drawings = [], selectedFolderId = null, message = '' }: Props = $props();

	let viewMode: ViewMode = $state('grid');
	let selectedIds = new SvelteSet<number>();
	let preSelectedIds = new SvelteSet<number>();
	let isDragging = $state(false);
	let hasMovedEnough = $state(false);
	let selectionRect: Rect | null = $state(null);
	let areaEl: HTMLElement | null = $state(null);
	let dragStart: Point | null = $state(null);
	let lastClickedId: number | null = $state(null);
	let contextMenu: ContextMenuState | null = $state(null);
	let moveFolderOpen = $state(false);
	let dragJustEnded = $state(false);

	const selectedCount = $derived(selectedIds.size);
	const anySelectedHasFolder = $derived(
		[...selectedIds].some((id) => drawings.find((d) => d.id === id)?.folderId != null)
	);
	const headerTitle = $derived(
		selectedFolderId
			? (folders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder')
			: 'All drawings'
	);

	function getFolderName(folderId: number | null) {
		if (folderId === null) return 'no folder';
		return folders.find((f) => f.id === folderId)?.name ?? 'no folder';
	}

	function getFolderDrawingCount(folderId: number) {
		return drawings.filter((d) => d.folderId === folderId).length;
	}

	function toggleSelection(itemId: number, ctrl: boolean, shift: boolean) {
		const { selection, lastClickedId: nextLastClickedId } = toggleSelectionState({
			selectedIds,
			orderedIds: drawings.map((d) => d.id),
			lastClickedId,
			itemId,
			ctrl,
			shift
		});
		selectedIds.clear();
		for (const id of selection) selectedIds.add(id);
		lastClickedId = nextLastClickedId;
	}

	function clearSelection() {
		selectedIds.clear();
	}

	async function refresh() {
		try {
			await invalidateAll();
		} catch {
			// navigation was destroyed mid-flight; the next load will reflect the changes
		}
	}

	function closeMenu() {
		contextMenu = null;
	}

	function openDrawing(id: number) {
		goto(resolve(`/draw/${id}`));
	}

	function newDrawing() {
		const title = prompt('Drawing title:', 'Untitled');
		if (!title) return;
		const body: api.NewDrawingInput = { title };
		if (selectedFolderId != null) body.folderId = selectedFolderId;
		api
			.createDrawing(body)
			.then(({ id }) => goto(resolve(`/draw/${id}`)))
			.catch(() => {});
	}

	function newFolder() {
		const name = prompt('Folder name:');
		if (!name) return;
		api
			.createFolder(name)
			.then(refresh)
			.catch(() => {});
	}

	function deleteDrawing(id: number, title?: string) {
		const label = drawings.find((d) => d.id === id)?.title ?? title?.trim() ?? 'Untitled';
		if (!confirm(`Delete "${label}"?`)) return;
		api
			.deleteDrawing(id)
			.then(refresh)
			.catch(() => {});
	}

	function deleteSelected() {
		if (selectedIds.size === 0) return;
		const single = selectedIds.size === 1 ? [...selectedIds][0] : null;
		const msg =
			single != null
				? `Delete "${drawings.find((d) => d.id === single)?.title ?? 'Untitled'}"?`
				: `Delete ${selectedIds.size} drawing(s)?`;
		if (!confirm(msg)) return;
		const ids = [...selectedIds];
		clearSelection();
		api
			.deleteDrawings(ids)
			.then(refresh)
			.catch(() => {});
	}

	function moveDrawing(id: number, folderId: number | null) {
		api
			.moveDrawing(id, folderId)
			.then(refresh)
			.catch(() => {});
	}

	function moveSelected(folderId: number | null) {
		if (selectedIds.size === 0) return;
		api
			.moveDrawings([...selectedIds], folderId)
			.then(refresh)
			.catch(() => {});
	}

	function renameDrawing(id: number, currentTitle: string) {
		const newTitle = prompt('Rename drawing:', currentTitle);
		if (newTitle && newTitle !== currentTitle) {
			api
				.renameDrawing(id, newTitle)
				.then(refresh)
				.catch(() => {});
		}
	}

	function renameFolder(id: number, currentName: string) {
		const newName = prompt('Rename folder:', currentName);
		if (newName && newName !== currentName) {
			api
				.renameFolder(id, newName)
				.then(refresh)
				.catch(() => {});
		}
	}

	function deleteFolder(id: number, name: string) {
		const label = name || 'Untitled';
		const count = getFolderDrawingCount(id);
		let msg = `Delete folder "${label}"?`;
		if (count > 0) msg += ` It contains ${count} drawing${count !== 1 ? 's' : ''}.`;
		if (!confirm(msg)) return;

		const remove = async () => {
			if (
				count > 0 &&
				confirm(`Also delete the ${count} drawing${count !== 1 ? 's' : ''} inside "${label}"?`)
			) {
				await api.deleteDrawings(drawings.filter((d) => d.folderId === id).map((d) => d.id));
			}
			await api.deleteFolder(id);
		};

		remove()
			.then(() => (id === selectedFolderId ? goto(resolve('/')) : refresh()))
			.catch(() => {});
	}

	function createFolderAndMove(name: string, drawingIds: number[]) {
		api
			.createFolderAndMoveDrawings(name, drawingIds)
			.then(refresh)
			.catch(() => {});
	}

	const handlers: DashboardHandlers = {
		close: closeMenu,
		openDrawing,
		newDrawing,
		newFolder,
		deleteDrawing,
		deleteSelected,
		moveDrawing,
		moveSelected,
		renameDrawing,
		renameFolder,
		deleteFolder,
		createFolderAndMove
	};

	function openDrawingMenu(e: MouseEvent, d: DrawingItem) {
		e.preventDefault();
		e.stopPropagation();
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
		const pos = clampToViewport(e.clientX, e.clientY, 200, 80);
		const folder = selectedFolderId ? folders.find((f) => f.id === selectedFolderId) : null;
		contextMenu = { ...pos, type: 'sidebar', id: folder?.id, title: folder?.name };
	}

	// --- Drag-to-select (pointer events + pointer capture keep the frame on the area) ---

	function onAreaPointerDown(e: PointerEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('a') || target.closest('input')) return;
		if (target.closest('button')) return;
		if (!areaEl) return;

		e.preventDefault();
		areaEl.setPointerCapture(e.pointerId);

		const rect = areaEl.getBoundingClientRect();
		dragStart = { x: e.clientX - rect.left, y: e.clientY - rect.top };
		isDragging = true;
		hasMovedEnough = false;
		dragJustEnded = false;
		preSelectedIds.clear();
	}

	function onAreaPointerMove(e: PointerEvent) {
		if (!isDragging || !dragStart || !areaEl) return;
		const rect = areaEl.getBoundingClientRect();
		const current: Point = { x: e.clientX - rect.left, y: e.clientY - rect.top };

		if (
			!hasMovedEnough &&
			(Math.abs(current.x - dragStart.x) > DRAG_THRESHOLD ||
				Math.abs(current.y - dragStart.y) > DRAG_THRESHOLD)
		) {
			hasMovedEnough = true;
			if (!e.ctrlKey && !e.shiftKey) selectedIds.clear();
		}

		if (hasMovedEnough) {
			selectionRect = selectionRectFromPoints(dragStart, current);
			updatePreSelection(selectionRect);
		}
	}

	function onAreaPointerUp() {
		if (!hasMovedEnough) {
			isDragging = false;
			selectionRect = null;
			preSelectedIds.clear();
			dragStart = null;
			return;
		}

		dragJustEnded = true;
		for (const id of preSelectedIds) selectedIds.add(id);
		preSelectedIds.clear();
		isDragging = false;
		selectionRect = null;
		dragStart = null;
	}

	function updatePreSelection(sr: Rect) {
		if (!areaEl) return;
		preSelectedIds.clear();
		const items = areaEl.querySelectorAll('[data-drawing-id]');
		const areaRect = areaEl.getBoundingClientRect();

		items.forEach((el) => {
			const r = el.getBoundingClientRect();
			const itemRect: Rect = {
				x: r.left - areaRect.left,
				y: r.top - areaRect.top,
				w: r.width,
				h: r.height
			};
			if (rectsIntersect(sr, itemRect)) {
				preSelectedIds.add(Number(el.getAttribute('data-drawing-id')));
			}
		});
	}

	function onAreaClick(e: MouseEvent) {
		if (dragJustEnded) {
			dragJustEnded = false;
			return;
		}
		if (selectedIds.size > 0 && !(e.target as HTMLElement).closest('[data-drawing-id]')) {
			clearSelection();
		}
	}

	function handleDrawingClick(e: MouseEvent, d: DrawingItem) {
		e.preventDefault();
		if (dragJustEnded) {
			dragJustEnded = false;
			return;
		}
		if (e.ctrlKey || e.shiftKey) {
			toggleSelection(d.id, e.ctrlKey, e.shiftKey);
		} else {
			openDrawing(d.id);
		}
	}

	function onAreaKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			clearSelection();
			closeMenu();
			moveFolderOpen = false;
		}
	}

	// Closes floating overlays when clicking anywhere outside them.
	const closeOverlays: Attachment<HTMLElement> = () => {
		const onClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			if (contextMenu && !target.closest('.context-menu')) contextMenu = null;
			if (moveFolderOpen && !target.closest('.move-folder-wrap')) moveFolderOpen = false;
		};
		window.addEventListener('click', onClick);
		return () => window.removeEventListener('click', onClick);
	};
</script>

<div class="dashboard" {@attach closeOverlays}>
	<DashboardSidebar
		{folders}
		{selectedFolderId}
		{handlers}
		onFolderContextMenu={openFolderMenu}
		onSidebarContextMenu={openSidebarMenu}
	/>

	<main class="dashboard-main" oncontextmenu={openDashboardMenu}>
		<DashboardHeader
			title={headerTitle}
			{folders}
			{selectedCount}
			selectedHaveFolder={anySelectedHasFolder}
			{viewMode}
			{moveFolderOpen}
			{handlers}
			onViewModeChange={(mode) => (viewMode = mode)}
			onToggleMoveFolder={() => (moveFolderOpen = !moveFolderOpen)}
		/>

		{#if message}
			<p class="error">{message}</p>
		{/if}

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="drawings-area"
			bind:this={areaEl}
			onpointerdown={onAreaPointerDown}
			onpointermove={onAreaPointerMove}
			onpointerup={onAreaPointerUp}
			onclick={onAreaClick}
			onkeydown={onAreaKeydown}
			role="application"
			aria-label="Drawings selection area"
		>
			<DrawingsView
				{viewMode}
				{drawings}
				{selectedIds}
				{preSelectedIds}
				{selectionRect}
				showSelectionRect={isDragging && hasMovedEnough}
				{handlers}
				{getFolderName}
				onDrawingClick={handleDrawingClick}
				onDrawingContextMenu={openDrawingMenu}
			/>
		</div>
	</main>
</div>

<svelte:window onkeydown={onAreaKeydown} />

{#if contextMenu}
	<ContextMenu menu={contextMenu} {folders} {drawings} {selectedIds} {handlers} />
{/if}

<style>
	.dashboard {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.dashboard-main {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		user-select: none;
		display: flex;
		flex-direction: column;
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
</style>
