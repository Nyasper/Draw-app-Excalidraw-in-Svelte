import { afterEach, describe, expect, it } from 'vitest';
import { clampToViewport, rectsIntersect, selectionRectFromPoints } from '$lib/dashboard/geometry';

const originalWindow = globalThis.window as unknown;

afterEach(() => {
	Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
});

describe('selectionRectFromPoints', () => {
	it('normalizes a drag from bottom-right to top-left', () => {
		expect(selectionRectFromPoints({ x: 100, y: 100 }, { x: 50, y: 60 })).toEqual({
			x: 50,
			y: 60,
			w: 50,
			h: 40
		});
	});

	it('keeps the rectangle when dragging forward', () => {
		expect(selectionRectFromPoints({ x: 10, y: 5 }, { x: 20, y: 25 })).toEqual({
			x: 10,
			y: 5,
			w: 10,
			h: 20
		});
	});

	it('produces a zero-size rectangle for a click', () => {
		expect(selectionRectFromPoints({ x: 10, y: 5 }, { x: 10, y: 5 })).toEqual({
			x: 10,
			y: 5,
			w: 0,
			h: 0
		});
	});
});

describe('rectsIntersect', () => {
	it('returns true for overlapping rectangles', () => {
		expect(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 })).toBe(true);
	});

	it('returns true when one rectangle is inside the other', () => {
		expect(rectsIntersect({ x: 0, y: 0, w: 100, h: 100 }, { x: 10, y: 10, w: 5, h: 5 })).toBe(true);
	});

	it('returns false for disjoint rectangles', () => {
		expect(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 20, y: 20, w: 10, h: 10 })).toBe(
			false
		);
	});

	it('returns false for edge-adjacent rectangles', () => {
		expect(rectsIntersect({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 })).toBe(false);
	});
});

describe('clampToViewport', () => {
	it('clamps the menu inside the window', () => {
		Object.defineProperty(globalThis, 'window', {
			value: { innerWidth: 1024, innerHeight: 768 },
			configurable: true
		});
		expect(clampToViewport(1500, 900)).toEqual({ x: 864, y: 648 });
		expect(clampToViewport(-100, -100)).toEqual({ x: 0, y: 0 });
	});

	it('allows the menu to stay out of the way when near the edges', () => {
		Object.defineProperty(globalThis, 'window', {
			value: { innerWidth: 800, innerHeight: 600 },
			configurable: true
		});
		expect(clampToViewport(400, 300)).toEqual({ x: 400, y: 300 });
	});
});
