<script lang="ts">
	interface Props {
		size?: number;
	}

	let { size = 14 }: Props = $props();
</script>

<svg
	class="spinner"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	aria-hidden="true"
>
	<circle
		cx="12"
		cy="12"
		r="10"
		stroke="currentColor"
		stroke-width="3"
		stroke-linecap="round"
		stroke-dasharray="47.1"
		stroke-dashoffset="15.7"
		fill="none"
	/>
</svg>

<style>
	.spinner {
		display: inline-block;
		flex-shrink: 0;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
