import { pgTable, serial, integer, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth.schema';

export const folder = pgTable(
	'folder',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		parentFolderId: integer('parent_folder_id').references(() => folder.id, {
			onDelete: 'set null'
		}),
		name: text('name').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('folder_user_id_idx').on(table.userId)]
);

export const drawing = pgTable(
	'drawing',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
		folderId: integer('folder_id').references(() => folder.id, { onDelete: 'set null' }),
		title: text('title').notNull().default('Untitled'),
		elements: jsonb('elements'),
		appState: jsonb('app_state'),
		files: jsonb('files'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at')
			.defaultNow()
			.$onUpdate(() => new Date())
			.notNull()
	},
	(table) => [index('drawing_user_id_idx').on(table.userId)]
);

export * from './auth.schema';
