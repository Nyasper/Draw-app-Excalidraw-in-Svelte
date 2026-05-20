<script lang="ts">
	import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
	import type {
		AppState,
		BinaryFiles,
		ExcalidrawImperativeAPI,
		ExcalidrawInitialDataState
	} from '@excalidraw/excalidraw/types';
	import { resolve } from '$app/paths';
	import Excalidraw from '$lib/components/Excalidraw.svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let excalidrawAPI: ExcalidrawImperativeAPI | null = $state(null);
	let title = $state(data.drawing.title);
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const drawingId = $derived(data.drawing.id);

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

	function handleChange(
		elements: readonly ExcalidrawElement[],
		appState: AppState,
		files: BinaryFiles
	) {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveToServer(elements, appState, files), 3000);
	}

	async function saveToServer(
		elements: readonly ExcalidrawElement[],
		appState: AppState,
		files: BinaryFiles
	) {
		saveStatus = 'saving';

		try {
			await fetch(resolve(`/draw/${drawingId}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, elements, appState, files })
			});
			saveStatus = 'saved';
			setTimeout(() => {
				if (saveStatus === 'saved') saveStatus = 'idle';
			}, 2000);
		} catch {
			saveStatus = 'error';
		}
	}

	function manualSave() {
		if (!excalidrawAPI) return;
		const elements = excalidrawAPI.getSceneElements();
		const appState = excalidrawAPI.getAppState();
		const files = excalidrawAPI.getFiles();
		saveToServer(
			elements as readonly ExcalidrawElement[],
			appState as AppState,
			files as BinaryFiles
		);
	}

	async function handleDelete() {
		if (!confirm('Delete this drawing?')) return;
		await fetch(resolve(`/draw/${drawingId}`), { method: 'DELETE' });
		goto(resolve('/'));
	}

	$effect(() => {
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});
</script>

<svelte:head>
	<title>{title} — Svelte Excalidraw App</title>
</svelte:head>

<div class="canvas-page">
	<div class="canvas-toolbar">
		<a href={backUrl} class="btn btn-secondary back-btn">&larr; Back</a>

		<input class="title-input" type="text" bind:value={title} placeholder="Untitled" />
		<div class="save-area">
			{#if saveStatus === 'saving'}
				<span class="save-status">Saving...</span>
			{:else if saveStatus === 'saved'}
				<span class="save-status saved">Saved</span>
			{:else if saveStatus === 'error'}
				<span class="save-status error">Save failed</span>
			{/if}
			<button class="btn btn-primary" onclick={manualSave}>Save</button>
			<button class="btn btn-danger" onclick={handleDelete}>Delete</button>
		</div>
	</div>

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

	.canvas-wrapper {
		flex: 1;
		min-height: 0;
	}

	.canvas-wrapper :global(.root) {
		height: 100% !important;
	}
</style>
