<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import Excalidraw from '$lib/components/Excalidraw.svelte';
	import CanvasToolbar from '$lib/components/CanvasToolbar.svelte';
	import { SaveController } from '$lib/canvas-save.svelte';
	import { loading } from '$lib/loading.svelte';
	import * as api from '$lib/canvas/api';
	import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
	import type {
		AppState,
		BinaryFiles,
		ExcalidrawImperativeAPI,
		ExcalidrawInitialDataState
	} from '@excalidraw/excalidraw/types';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let title = $derived(data.drawing.title);
	let excalidrawAPI: ExcalidrawImperativeAPI | null = $state(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	const save = new SaveController();

	const drawingId = $derived(data.drawing.id);
	const saveStatus = $derived(save.status);

	const backUrl = $derived(
		data.drawing.folderId ? resolve(`/?folder=${data.drawing.folderId}`) : resolve('/')
	);

	const initialData = $derived<ExcalidrawInitialDataState | null>(
		data.drawing.elements
			? ({
					elements: data.drawing.elements,
					appState: {
						...data.drawing.appState,
						collaborators: new Map()
					},
					files: data.drawing.files
				} as unknown as ExcalidrawInitialDataState)
			: null
	);

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
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveToServer({ elements, appState, files }), 3000);
	}

	async function saveToServer(snap: api.ExcalidrawSnapshot) {
		save.begin();

		try {
			await loading.withPending('save', () =>
				api.updateDrawing(drawingId, { title, ...snap })
			);
			save.succeed();
		} catch {
			save.fail();
		}
	}

	function manualSave() {
		const snap = snapshot();
		if (!snap) return;
		saveToServer(snap);
	}

	async function handleDelete() {
		if (!confirm('Delete this drawing?')) return;
		await loading.withPending('delete', () => api.deleteDrawing(drawingId));
		goto(resolve('/'));
	}

	$effect(() => {
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
			save.destroy();
		};
	});
</script>

<svelte:head>
	<title>{title} — Svelte Excalidraw App</title>
</svelte:head>

<div class="canvas-page">
	<CanvasToolbar
		{backUrl}
		guest={false}
		bind:title
		{saveStatus}
		showDelete
		onSave={manualSave}
		onDelete={handleDelete}
	/>
	<div class="canvas-wrapper">
		<Excalidraw bind:excalidrawAPI {initialData} onChange={handleChange} />
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
