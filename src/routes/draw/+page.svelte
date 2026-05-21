<script lang="ts">
	import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
	import type {
		AppState,
		BinaryFiles,
		ExcalidrawImperativeAPI
	} from '@excalidraw/excalidraw/types';
	import { resolve } from '$app/paths';
	import Excalidraw from '$lib/components/Excalidraw.svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import { browser } from '$app/environment';

	let { data }: PageProps = $props();

	let excalidrawAPI: ExcalidrawImperativeAPI | null = $state(null);
	let title = $state('Untitled');
	let saveStatus: 'idle' | 'saving' | 'saved' | 'error' = $state('idle');
	let drawingId: number | null = $state(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	const user = $derived(data.user);
	const guest = $derived(!user);

	function getLocalData() {
		if (!browser) return;
		if (!guest) return null;
		const saved = localStorage.getItem('excalidraw-guest');
		if (!saved) return null;
		try {
			const parsed = JSON.parse(saved);
			return {
				...parsed,
				appState: { ...parsed.appState, collaborators: new Map() }
			};
		} catch {
			return null;
		}
	}

	function handleChange(
		elements: readonly ExcalidrawElement[],
		appState: AppState,
		files: BinaryFiles
	) {
		if (guest) {
			localStorage.setItem('excalidraw-guest', JSON.stringify({ elements, appState, files }));
			return;
		}

		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => saveToServer(elements, appState, files), 3000);
	}

	function snapshot() {
		if (!excalidrawAPI) return null;
		return {
			elements: excalidrawAPI.getSceneElements(),
			appState: excalidrawAPI.getAppState(),
			files: excalidrawAPI.getFiles()
		};
	}

	async function saveToServer(
		elements: readonly ExcalidrawElement[],
		appState: AppState,
		files: BinaryFiles
	) {
		saveStatus = 'saving';

		try {
			if (drawingId) {
				await fetch(resolve(`/draw/${drawingId}`), {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title, elements, appState, files })
				});
			} else {
				const res = await fetch(resolve('/draw'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title, elements, appState, files })
				});
				const json = await res.json();
				drawingId = json.id;
				goto(resolve(`/draw/${drawingId}`), { replaceState: true });
			}
			saveStatus = 'saved';
			setTimeout(() => {
				if (saveStatus === 'saved') saveStatus = 'idle';
			}, 2000);
		} catch {
			saveStatus = 'error';
		}
	}

	async function manualSave() {
		const data = snapshot();
		if (!data) return;
		await saveToServer(
			data.elements as readonly ExcalidrawElement[],
			data.appState as AppState,
			data.files as BinaryFiles
		);
	}

	$effect(() => {
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});
</script>

<svelte:head>
	<title>{title || ''} — Svelte Excalidraw</title>
</svelte:head>

<div class="canvas-page">
	<div class="canvas-toolbar">
		<a href={resolve('/')} class="btn btn-secondary back-btn">&larr; Back</a>

		{#if guest}
			<div class="guest-banner">
				<span>Drawing as guest — your work is saved locally.</span>
				<a href={resolve('/register')} class="btn btn-primary">Sign up to save to the cloud</a>
			</div>
		{:else}
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
			</div>
		{/if}
	</div>

	<div class="canvas-wrapper">
		<Excalidraw bind:excalidrawAPI initialData={getLocalData()} onChange={handleChange} />
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

	.guest-banner {
		display: flex;
		align-items: center;
		gap: 1rem;
		font-size: 0.8rem;
		color: var(--text-muted);
		flex: 1;
		justify-content: flex-end;

		.btn {
			font-size: 0.75rem;
			padding: 0.3rem 0.8rem;
		}
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
