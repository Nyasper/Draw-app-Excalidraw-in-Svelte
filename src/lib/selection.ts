export interface ToggleSelectionInput {
	selectedIds: ReadonlySet<number>;
	orderedIds: readonly number[];
	lastClickedId: number | null;
	itemId: number;
	ctrl: boolean;
	shift: boolean;
}

export interface ToggleSelectionResult {
	selection: Set<number>;
	lastClickedId: number | null;
}

/**
 * Pure selection logic for the dashboard drawing grid/list. Mirrors the previous
 * inline behaviour in Dashboard.svelte:
 * - plain click clears the selection and selects only `itemId`
 * - ctrl toggles `itemId` without touching the rest
 * - shift selects an inclusive range from `lastClickedId` to `itemId` (relative to
 *   `orderedIds` order); combined with ctrl it keeps the existing selection
 * - an unknown last click or item is a no-op (selection and last click are unchanged)
 */
export function toggleSelection({
	selectedIds,
	orderedIds,
	lastClickedId,
	itemId,
	ctrl,
	shift
}: ToggleSelectionInput): ToggleSelectionResult {
	const next = new Set(selectedIds);

	if (shift && lastClickedId !== null) {
		const startIdx = orderedIds.indexOf(lastClickedId);
		const endIdx = orderedIds.indexOf(itemId);
		if (startIdx === -1 || endIdx === -1) {
			return { selection: next, lastClickedId };
		}
		const range = orderedIds.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
		if (!ctrl) next.clear();
		for (const id of range) next.add(id);
		return { selection: next, lastClickedId: itemId };
	}

	if (ctrl) {
		if (next.has(itemId)) next.delete(itemId);
		else next.add(itemId);
		return { selection: next, lastClickedId: itemId };
	}

	next.clear();
	next.add(itemId);
	return { selection: next, lastClickedId: itemId };
}
