<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import { createElement } from "react";
  import { createRoot } from "react-dom/client";
  import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

  let loading = $state(true);
  let excalidrawAPI: ExcalidrawImperativeAPI | null = $state(null);

  const excalidraw: Attachment<HTMLDivElement> = (container) => {
    if (!container.nodeName || container.nodeName !== "DIV") return;

    const root = createRoot(container);
    initExcalidraw();

    async function initExcalidraw() {
      const [{ Excalidraw, WelcomeScreen }] = await Promise.all([
        import("@excalidraw/excalidraw"),
        import("@excalidraw/excalidraw/index.css"),
      ]);
      loading = false;

      root.render(
        createElement(
          Excalidraw,
          {
            excalidrawAPI: (api) => (excalidrawAPI = api),
            theme: "dark",
            initialData: loadInitialData(),
          },
          createElement(WelcomeScreen),
        ),
      );
    }

    return () => {
      saveSnapshot();
      root.unmount();
    };
  };

  function loadInitialData() {
    const saved = localStorage.getItem("excalidraw-snapshot");
    let initialData = null;

    if (saved) {
      const parsed = JSON.parse(saved);
      initialData = {
        ...parsed,
        appState: {
          ...parsed.appState,
          collaborators: new Map(), // <-- siempre Map vacío al restaurar
        },
      };
    }
    return initialData;
  }

  function saveSnapshot() {
    if (!excalidrawAPI) return;

    const elements = excalidrawAPI.getSceneElements();
    const appState = excalidrawAPI.getAppState();
    const files = excalidrawAPI.getFiles();
    const scrollToContent = excalidrawAPI.scrollToContent();

    localStorage.setItem(
      "excalidraw-snapshot",
      JSON.stringify({ elements, appState, files, scrollToContent }),
    );
  }
</script>

<h1>Testing React Inside Svelte</h1>

{#if loading}
  <div class="loading-container">
    <p>Loading...</p>
  </div>
{:else}{/if}

<div {@attach excalidraw} class="root"></div>
<button onclick={saveSnapshot} disabled={!excalidrawAPI}>Save Snapshot</button>

<style>
  .root {
    height: 100svh;
  }

  .loading-container {
    position: absolute;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background-color: black;
    z-index: 10000;

    p {
      font-size: 3em;
      color: white;
    }
  }
</style>
