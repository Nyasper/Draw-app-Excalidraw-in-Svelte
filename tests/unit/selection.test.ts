import { describe, expect, it } from 'vitest';
import { toggleSelection } from '$lib/selection';

const ids = [1, 2, 3, 4, 5];

function run(itemId: number, ctrl: boolean, shift: boolean, lastClickedId: number | null = ids[0]) {
	return toggleSelection({
		selectedIds: new Set(),
		orderedIds: ids,
		lastClickedId,
		itemId,
		ctrl,
		shift
	});
}

describe('toggleSelection', () => {
	it('plain click clears the selection and selects only the clicked item', () => {
		const result = run(3, false, false);
		expect([...result.selection]).toEqual([3]);
		expect(result.lastClickedId).toBe(3);
	});

	it('ctrl keeps the existing selection and toggles the clicked item', () => {
		const base = new Set([1, 2]);
		const added = toggleSelection({
			selectedIds: base,
			orderedIds: ids,
			lastClickedId: null,
			itemId: 4,
			ctrl: true,
			shift: false
		});
		expect([...added.selection].sort()).toEqual([1, 2, 4]);

		const removed = toggleSelection({
			selectedIds: added.selection,
			orderedIds: ids,
			lastClickedId: 4,
			itemId: 2,
			ctrl: true,
			shift: false
		});
		expect([...removed.selection].sort()).toEqual([1, 4]);
	});

	it('shift selects an inclusive range from the last clicked item', () => {
		const result = run(4, false, true, 1);
		expect([...result.selection].sort()).toEqual([1, 2, 3, 4]);
	});

	it('shift range works backwards (clicking an earlier item)', () => {
		const result = run(2, false, true, 4);
		expect([...result.selection].sort()).toEqual([2, 3, 4]);
	});

	it('ctrl+shift adds the range without clearing the existing selection', () => {
		const base = new Set([5]);
		const result = toggleSelection({
			selectedIds: base,
			orderedIds: ids,
			lastClickedId: 1,
			itemId: 3,
			ctrl: true,
			shift: true
		});
		expect([...result.selection].sort()).toEqual([1, 2, 3, 5]);
	});

	it('shift with no prior click behaves like a plain click', () => {
		const result = run(3, false, true, null);
		expect([...result.selection]).toEqual([3]);
		expect(result.lastClickedId).toBe(3);
	});

	it('shift with an unknown last clicked id is a no-op', () => {
		const base = new Set([2]);
		const result = toggleSelection({
			selectedIds: base,
			orderedIds: ids,
			lastClickedId: 999,
			itemId: 4,
			ctrl: false,
			shift: true
		});
		expect([...result.selection]).toEqual([2]);
		expect(result.lastClickedId).toBe(999);
	});

	it('shift with an unknown target id is a no-op', () => {
		const base = new Set([2]);
		const result = toggleSelection({
			selectedIds: base,
			orderedIds: ids,
			lastClickedId: 1,
			itemId: 999,
			ctrl: false,
			shift: true
		});
		expect([...result.selection]).toEqual([2]);
		expect(result.lastClickedId).toBe(1);
	});

	it('range is relative to orderedIds order, not the numeric values', () => {
		const scrambled = [40, 10, 30, 20];
		const result = toggleSelection({
			selectedIds: new Set(),
			orderedIds: scrambled,
			lastClickedId: 40,
			itemId: 30,
			ctrl: false,
			shift: true
		});
		expect([...result.selection].sort()).toEqual([10, 30, 40]);
	});

	it('does not mutate the input selection set', () => {
		const base = new Set([1, 2]);
		const result = toggleSelection({
			selectedIds: base,
			orderedIds: ids,
			lastClickedId: 1,
			itemId: 4,
			ctrl: false,
			shift: true
		});
		expect([...base]).toEqual([1, 2]);
		expect(result.selection).not.toBe(base);
	});

	it('plain click on an already-selected item keeps just that item', () => {
		const base = new Set([1, 2]);
		const result = toggleSelection({
			selectedIds: base,
			orderedIds: ids,
			lastClickedId: 1,
			itemId: 2,
			ctrl: false,
			shift: false
		});
		expect([...result.selection]).toEqual([2]);
	});

	it('shift range over a single item selects just it', () => {
		const result = run(2, false, true, 2);
		expect([...result.selection]).toEqual([2]);
	});
});
