<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';

	interface DashboardDrawing {
		id: number;
		title: string;
		folderId: number | null;
		createdAt: Date;
		updatedAt: Date;
	}

	interface DashboardFolder {
		id: number;
		name: string;
		createdAt: Date;
		parentFolderId: number | null;
	}

	interface Props {
		folders: DashboardFolder[];
		drawings: DashboardDrawing[];
		selectedFolderId: number | null;
		message?: string;
	}

	let { folders = [], drawings = [], selectedFolderId = null, message }: Props = $props();
</script>

<div class="dashboard">
	<aside class="sidebar">
		<div class="sidebar-header">
			<h2>Folders</h2>
		</div>
		<nav class="folder-list">
			<a href={resolve('/')} class:active={selectedFolderId === null} class="folder-item">
				All drawings
			</a>
			{#each folders as f (f.id)}
				<a
					href={resolve(`/?folder=${f.id}`)}
					class:active={selectedFolderId === f.id}
					class="folder-item"
				>
					{f.name}
				</a>
			{/each}
		</nav>
		<form method="post" use:enhance class="new-folder-form">
			<input type="text" name="folderName" placeholder="New folder..." required />
			<button class="btn btn-primary" name="action" value="createFolder" type="submit">+</button>
		</form>
	</aside>

	<main class="dashboard-main">
		<div class="dashboard-header">
			<h2>
				{selectedFolderId
					? (folders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder')
					: 'All drawings'}
			</h2>
			<a href={resolve('/draw')} class="btn btn-primary">New drawing</a>
		</div>

		{#if message}
			<p class="error">{message}</p>
		{/if}

		<div class="drawings-grid">
			{#each drawings as d (d.id)}
				<a href={resolve(`/draw/${d.id}`)} class="drawing-card">
					<div class="drawing-preview">
						<span class="drawing-icon">&#9998;</span>
					</div>
					<div class="drawing-info">
						<span class="drawing-title">{d.title}</span>
						<span class="drawing-date">{new Date(d.updatedAt).toLocaleDateString()}</span>
					</div>
				</a>
			{/each}
			{#if drawings.length === 0}
				<div class="empty-state">
					<p>No drawings yet.</p>
					<p>Click <strong>"New drawing"</strong> to get started!</p>
				</div>
			{/if}
		</div>
	</main>
</div>

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
	}

	.sidebar-header h2 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
		margin-bottom: 0.25rem;
	}

	.folder-list {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.folder-item {
		padding: 0.4rem 0.6rem;
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--text-muted);
		transition: background-color 0.15s;

		&:hover {
			background-color: var(--bg-hover);
			color: var(--text-primary);
		}

		&.active {
			background-color: var(--accent);
			color: white;
		}
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

	.error {
		color: var(--danger);
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	.drawings-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.drawing-card {
		background-color: var(--bg-secondary);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		overflow: hidden;
		transition: border-color 0.15s;

		&:hover {
			border-color: var(--accent);
		}
	}

	.drawing-preview {
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

	.drawing-info {
		padding: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.drawing-title {
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.drawing-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 3rem 1rem;
		color: var(--text-muted);

		p {
			margin-bottom: 0.25rem;
		}
	}
</style>
