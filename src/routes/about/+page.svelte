<script lang="ts">
</script>

<svelte:head>
	<title>About — Svelte Excalidraw App</title>
</svelte:head>

<div class="about-page">
	<h1>About this project</h1>

	<section class="reason">
		<h2>Why this project exists</h2>

		<h3>English</h3>
		<p>
			This project was created for <strong>two main reasons</strong>:
		</p>
		<ol>
			<li>
				<strong>Prove that React libraries can run inside Svelte.</strong>
				The core idea is to demonstrate that it's entirely possible to embed a React component &mdash;
				even a complex one like Excalidraw &mdash; inside a Svelte application. By initializing the React
				component within a Svelte 5 <code>&#123;&#64;attach excalidraw&#125;</code>
				directive, we bridge the two frameworks seamlessly. React becomes just another rendering target,
				while Svelte handles routing, server logic, state management, and the overall architecture.
			</li>
			<li>
				<strong>Svelte is the framework I know best.</strong>
				I chose Svelte not because it's trendy, but because it's the framework I'm most comfortable with.
				I wanted to build something real and full-featured using the tools I understand deeply. Svelte
				5's runes mode (<code>$state</code>, <code>$derived</code>,
				<code>$effect</code>), SvelteKit's file-based routing, and the clean separation between
				client and server make it an excellent choice for this kind of project.
			</li>
		</ol>

		<h3>Español</h3>
		<p>
			Este proyecto nació por <strong>dos razones principales</strong>:
		</p>
		<ol>
			<li>
				<strong>Demostrar que es posible utilizar librerías de React dentro de Svelte.</strong>
				La idea central es probar que es completamente factible embeber un componente de React &mdash;
				incluso uno tan complejo como Excalidraw &mdash; dentro de una aplicación Svelte. Inicializando
				el componente de React dentro de la directiva
				<code>&#123;&#64;attach excalidraw&#125;</code> de Svelte 5, logramos conectar ambos frameworks
				de forma transparente. React se convierte simplemente en otro destino de renderizado, mientras
				que Svelte se encarga del routing, la lógica del servidor, la gestión de estado y toda la arquitectura.
			</li>
			<li>
				<strong>Svelte es el framework que más domino.</strong>
				Elegí Svelte no porque esté de moda, sino porque es el framework con el que me siento más cómodo.
				Quería construir algo real y con todas sus funcionalidades usando las herramientas que entiendo
				a profundidad. El modo runes de Svelte 5 (<code>$state</code>,
				<code>$derived</code>, <code>$effect</code>), el routing basado en archivos de SvelteKit y
				la limpia separación entre cliente y servidor lo convierten en una excelente elección para
				este tipo de proyecto.
			</li>
		</ol>
		<p class="result">
			The result? A working Excalidraw clone with auth, database persistence, and folder
			organization &mdash; all powered by Svelte, with React living quietly inside a single
			component.
		</p>
	</section>

	<section class="tech">
		<h2>Tech Stack</h2>
		<table>
			<thead>
				<tr>
					<th>Layer</th>
					<th>Technology</th>
				</tr>
			</thead>
			<tbody>
				<tr><td>Frontend</td><td>Svelte 5 (runes mode)</td></tr>
				<tr><td>Full-stack framework</td><td>SvelteKit</td></tr>
				<tr><td>Backend</td><td>SvelteKit server actions + load functions</td></tr>
				<tr><td>Auth</td><td>Better Auth (email/password + GitHub OAuth)</td></tr>
				<tr><td>ORM</td><td>Drizzle ORM</td></tr>
				<tr><td>Database</td><td>PostgreSQL 18</td></tr>
				<tr><td>DB Runtime</td><td>Docker Compose (local development)</td></tr>
				<tr><td>React component</td><td>@excalidraw/excalidraw</td></tr>
				<tr><td>React bridge</td><td>react + react-dom (initialized inside @attach)</td></tr>
				<tr><td>Language</td><td>TypeScript (strict mode)</td></tr>
				<tr><td>Package manager</td><td>Bun</td></tr>
				<tr><td>Linting/Formatting</td><td>ESLint + Prettier</td></tr>
			</tbody>
		</table>
	</section>
</div>

<style>
	.about-page {
		max-width: 720px;
		margin: 3rem auto;
		padding: 0 1.5rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: var(--text-primary);
	}

	h2 {
		font-size: 1.3rem;
		margin: 2rem 0 1rem;
		color: var(--text-primary);
	}

	h3 {
		font-size: 1rem;
		margin: 1.2rem 0 0.5rem;
		color: var(--accent);
	}

	p {
		line-height: 1.7;
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}

	ol {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
		line-height: 1.7;
		color: var(--text-muted);
	}

	li {
		margin-bottom: 0.75rem;
	}

	code {
		background-color: var(--bg-tertiary);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.9em;
		color: var(--accent);
	}

	.result {
		margin-top: 1.5rem;
		font-style: italic;
		color: var(--text-primary) !important;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.5rem;
	}

	th,
	td {
		padding: 0.6rem 1rem;
		text-align: left;
		border-bottom: 1px solid var(--border);
		font-size: 0.9rem;
	}

	th {
		color: var(--text-primary);
		font-weight: 600;
	}

	td {
		color: var(--text-muted);
	}
</style>
