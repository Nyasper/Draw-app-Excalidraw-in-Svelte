import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		'process.env.IS_PREACT': JSON.stringify('true')
	},
	test: {
		include: ['tests/**/*.test.ts'],
		environment: 'node',
		// DB integration tests share one Postgres database; never run files in parallel.
		fileParallelism: false,
		globalSetup: ['./tests/global-setup.ts']
	}
});
