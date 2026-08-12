export interface DrawingItem {
	id: number;
	title: string;
	folderId: number | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface FolderItem {
	id: number;
	name: string;
	createdAt: Date;
	parentFolderId: number | null;
}

export type ContextMenuType = 'drawing' | 'folder' | 'dashboard' | 'sidebar';

export type ContextMenuState =
	| { x: number; y: number; type: 'drawing'; id: number; title: string }
	| { x: number; y: number; type: 'folder'; id: number; title: string }
	| { x: number; y: number; type: 'dashboard' }
	| { x: number; y: number; type: 'sidebar'; id?: number; title?: string };

export type ViewMode = 'grid' | 'list';

/**
 * Callbacks the dashboard orchestrator exposes to its presentational children.
 * They close over the reactive state, so the object itself never needs to change.
 */
export interface DashboardHandlers {
	/** Closes the open context menu and resets any related menu state. */
	close: () => void;
	openDrawing: (id: number) => void;
	newDrawing: () => void;
	newFolder: () => void;
	deleteDrawing: (id: number, title?: string) => void;
	deleteSelected: () => void;
	moveDrawing: (id: number, folderId: number | null) => void;
	moveSelected: (folderId: number | null) => void;
	renameDrawing: (id: number, currentTitle: string) => void;
	renameFolder: (id: number, currentName: string) => void;
	deleteFolder: (id: number, name: string) => void;
	createFolderAndMove: (name: string, drawingIds: number[]) => void;
}
