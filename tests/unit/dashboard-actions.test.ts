import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	createDrawing,
	createFolder,
	createFolderAndMoveDrawings,
	deleteDrawing,
	deleteDrawings,
	moveDrawings,
	renameDrawing,
	renameFolder
} from '$lib/dashboard/actions';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), { status });
}

beforeEach(() => {
	vi.stubGlobal('fetch', fetchMock);
	fetchMock.mockReset();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('createDrawing', () => {
	it('posts the payload and returns the created id', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ id: 42 }, 201));

		const result = await createDrawing({ title: 'My drawing', folderId: 3 });

		expect(result).toEqual({ id: 42 });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/draw');
		expect(init.method).toBe('POST');
		expect(init.headers['Content-Type']).toBe('application/json');
		expect(JSON.parse(init.body)).toEqual({ title: 'My drawing', folderId: 3 });
	});

	it('omits folderId when not provided', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ id: 1 }, 201));

		await createDrawing({ title: 'standalone' });

		const [, init] = fetchMock.mock.calls[0];
		expect(JSON.parse(init.body)).toEqual({ title: 'standalone' });
	});

	it('throws when the server rejects', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ error: 'no' }, 500));

		await expect(createDrawing({ title: 'x' })).rejects.toThrow();
	});
});

describe('createFolder', () => {
	it('posts the folder name and returns the folder', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ id: 9, name: 'Ideas', parent_id: null }, 201));

		const folder = await createFolder('Ideas');

		expect(folder).toEqual({ id: 9, name: 'Ideas', parent_id: null });
		expect(fetchMock).toHaveBeenCalledWith('/folders', expect.objectContaining({ method: 'POST' }));
	});
});

describe('moveDrawings', () => {
	it('updates each drawing with the target folder', async () => {
		fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));

		await moveDrawings([7, 8], 4);

		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(fetchMock).toHaveBeenCalledWith('/draw/7', expect.objectContaining({ method: 'PUT' }));
		const [, init] = fetchMock.mock.calls[1];
		expect(JSON.parse(init.body)).toEqual({ folderId: 4 });
	});
});

describe('deleteDrawings', () => {
	it('deletes every drawing', async () => {
		fetchMock.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));

		await deleteDrawings([1, 2, 3]);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		expect(fetchMock).toHaveBeenCalledWith(
			'/draw/1',
			expect.objectContaining({ method: 'DELETE' })
		);
		expect(fetchMock).toHaveBeenCalledWith(
			'/draw/3',
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('aborts on the first failed delete', async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ ok: true }))
			.mockResolvedValueOnce(jsonResponse({ error: 'gone' }, 404));

		await expect(deleteDrawings([1, 2])).rejects.toThrow();
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe('createFolderAndMoveDrawings', () => {
	it('creates a folder then moves the drawings into it', async () => {
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ id: 5, name: 'New', parent_id: null }, 201))
			.mockImplementation(() => Promise.resolve(jsonResponse({ ok: true })));

		await createFolderAndMoveDrawings('New', [1, 2]);

		expect(fetchMock).toHaveBeenCalledTimes(3);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/folders');
		expect(JSON.parse(init.body)).toEqual({ name: 'New' });
		expect(fetchMock).toHaveBeenCalledWith('/draw/1', expect.objectContaining({ method: 'PUT' }));
		expect(fetchMock).toHaveBeenCalledWith('/draw/2', expect.objectContaining({ method: 'PUT' }));
	});
});

describe('renameDrawing / renameFolder', () => {
	it('renames a drawing', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
		await renameDrawing(3, 'Edgy title');
		expect(fetchMock).toHaveBeenCalledWith('/draw/3', expect.objectContaining({ method: 'PUT' }));
	});

	it('renames a folder', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
		await renameFolder(6, 'Cool folder');
		expect(fetchMock).toHaveBeenCalledWith(
			'/folders/6',
			expect.objectContaining({ method: 'PUT' })
		);
	});
});

describe('deleteDrawing', () => {
	it('deletes a single drawing', async () => {
		fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
		await deleteDrawing(10);
		expect(fetchMock).toHaveBeenCalledWith(
			'/draw/10',
			expect.objectContaining({ method: 'DELETE' })
		);
	});
});
