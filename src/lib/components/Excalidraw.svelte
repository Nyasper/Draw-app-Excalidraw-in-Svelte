<script lang="ts">
	import type { Attachment } from 'svelte/attachments';
	import { createElement } from 'react';
	import { createRoot } from 'react-dom/client';
	import type {
		ExcalidrawImperativeAPI,
		AppState,
		BinaryFiles,
		ExcalidrawInitialDataState
	} from '@excalidraw/excalidraw/types';
	import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';

	interface Props {
		initialData: ExcalidrawInitialDataState | null;
		onChange?: (
			elements: readonly ExcalidrawElement[],
			appState: AppState,
			files: BinaryFiles
		) => void;
		excalidrawAPI?: ExcalidrawImperativeAPI | null;
	}

	let {
		initialData = null,
		onChange,
		// eslint-disable-next-line no-useless-assignment
		excalidrawAPI = $bindable(null)
	}: Props = $props();

	let loading = $state(true);

	const excalidraw: Attachment<HTMLDivElement> = (container) => {
		if (!container.nodeName || container.nodeName !== 'DIV') return;

		const root = createRoot(container);
		initExcalidraw();

		async function initExcalidraw() {
			const [{ Excalidraw, WelcomeScreen }] = await Promise.all([
				import('@excalidraw/excalidraw'),
				import('@excalidraw/excalidraw/index.css')
			]);
			loading = false;

			const props: Record<string, unknown> = {
				excalidrawAPI: (api: ExcalidrawImperativeAPI) => (excalidrawAPI = api),
				theme: 'dark'
			};

			if (initialData) props.initialData = initialData;
			if (onChange) {
				props.onChange = (
					elements: readonly ExcalidrawElement[],
					appState: AppState,
					files: BinaryFiles
				) => {
					onChange(elements, appState, files);
				};
			}

			root.render(createElement(Excalidraw, props, createElement(WelcomeScreen)));
		}

		return () => {
			root.unmount();
		};
	};
</script>

{#if loading}
	<div class="loading-container">
		<p>Loading...</p>
	</div>
{/if}

<div {@attach excalidraw} class="root"></div>

<style>
	.root {
		height: 100svh;
	}

	.loading-container {
		position: absolute;
		inset: 0;
		width: 100vw;
		height: 100vh;
		background-color: black;
		z-index: 10000;
		display: flex;
		align-items: center;
		justify-content: center;

		p {
			font-size: 3em;
			color: white;
		}
	}
</style>
