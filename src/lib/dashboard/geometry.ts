export interface Point {
	x: number;
	y: number;
}

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** Builds a normalized selection rectangle from the drag start and current points. */
export function selectionRectFromPoints(start: Point, current: Point): Rect {
	return {
		x: Math.min(start.x, current.x),
		y: Math.min(start.y, current.y),
		w: Math.abs(current.x - start.x),
		h: Math.abs(current.y - start.y)
	};
}

/** Axis-aligned rectangle intersection, used to hit-test drawings against the selection box. */
export function rectsIntersect(a: Rect, b: Rect): boolean {
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Keeps a floating menu inside the viewport. Defaults match the context menu size. */
export function clampToViewport(x: number, y: number, menuW = 160, menuH = 120): Point {
	return {
		x: Math.max(0, Math.min(x, window.innerWidth - menuW)),
		y: Math.max(0, Math.min(y, window.innerHeight - menuH))
	};
}
