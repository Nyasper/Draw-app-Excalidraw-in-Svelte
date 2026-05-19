<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: import('svelte').Snippet; data: LayoutData } = $props();

	const isCanvas = $derived(page.url.pathname.startsWith('/draw'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="app-shell">
	{#if !isCanvas}
		<Nav user={data.user} />
	{/if}
	<main class="main-content" class:canvas={isCanvas}>
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.main-content.canvas {
		overflow: hidden;
	}
</style>
