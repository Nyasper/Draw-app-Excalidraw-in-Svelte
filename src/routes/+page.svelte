<script lang="ts">
	import Dashboard from '$lib/components/Dashboard.svelte';
	import Landing from '$lib/components/Landing.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>DrawApp</title>
</svelte:head>

{#if data.user}
	<Dashboard
		folders={data.folders}
		drawings={data.drawings}
		selectedFolderId={data.selectedFolderId}
		message={data.message}
	/>
{:else}
	<Landing />
{/if}
