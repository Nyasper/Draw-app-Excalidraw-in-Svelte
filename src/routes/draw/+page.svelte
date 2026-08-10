<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import Excalidraw from '$lib/components/Excalidraw.svelte';
	import CanvasToolbar from '$lib/components/CanvasToolbar.svelte';
	import { GUEST_STORAGE_KEY, loadGuestData, saveGuestData } from '$lib/guest';
	import { SaveController } from '$lib/canvas-save.svelte';
	import * as api from '$lib/canvas/api';
	import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
	import type {
		AppState,
		BinaryFiles,
		ExcalidrawImperativeAPI
	} from '@excalidraw/excalidraw/types';
	import type { ExcalidrawInitialDataState } from '@excalidraw/excalidraw/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let excalidrawAPI: ExcalidrawImperativeAPI | null = $state(null);
	let title = $state('Untitled');
	let drawingId: number | null = $state(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	const save = new SaveController();

	const user = $derived(data.user);
	const guest = $derived(!user);
	const saveStatus = $derived(save.status);

	function getLocalData() {
		if (!browser || !guest) return null;
		return loadGuestData(localStorage.getItem(GUEST_STORAGE_KEY));
	}

	function snapshot(): api.ExcalidrawSnapshot | null {
		if (!excalidrawAPI) return null;
		return {
			elements: excalidrawAPI.getSceneElements(),
			appState: excalidrawAPI.getAppState(),
			files: excalidrawAPI.getFiles()
		};
	}

	function handleChange(
		elements: readonly ExcalidrawElement[],
		appState: AppState,
		files: BinaryFiles
	) {
		if (guest) {
			localStorage.setItem(GUEST_STORAGE_KEY, saveGuestData({ elements, appState, files }));
			return;
		}

		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveToServer({ elements, appState, files }), 3000);
	}

	async function saveToServer(snap: api.ExcalidrawSnapshot) {
		save.begin();

		try {
			if (drawingId) {
				await api.updateDrawing(drawingId, { title, ...snap });
			} else {
				const { id } = await api.createDrawing({ title, ...snap });
				drawingId = id;
				goto(resolve(`/draw/${id}`), { replaceState: true });
			}
			save.succeed();
		} catch (err) {
			save.fail();
			if (err instanceof api.ApiError && err.status === 401) {
				goto(resolve('/login'));
			}
		}
	}

	function manualSave() {
		const snap = snapshot();
		if (!snap) return;
		saveToServer(snap);
	}

	$effect(() => {
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
			save.destroy();
		};
	});
</script>

<svelte:head>
	<title>{title || ''} — Svelte Excalidraw</title>
</svelte:head>

<div class="canvas-page">
	<CanvasToolbar backUrl={resolve('/')} {guest} bind:title {saveStatus} onSave={manualSave} />
	<div class="canvas-wrapper">
		<Excalidraw
			bind:excalidrawAPI
			initialData={getLocalData() as ExcalidrawInitialDataState | null}
			onChange={handleChange}
		/>
	</div>
</div>

<style>
	.canvas-page {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
	}

	.canvas-wrapper {
		flex: 1;
		min-height: 0;
	}

	.canvas-wrapper :global(.root) {
		height: 100% !important;
	}
</style>
