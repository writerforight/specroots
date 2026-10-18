import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

interface IndexEntry {
  id: string;
  forms: string[];
  meaning: { en?: string };
  words: string[];
}

const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Writes the root list into index.html as plain HTML, so search engines and readers without
 * JavaScript see real content. The app replaces it on start. Built from public/data/index.json,
 * so it never drifts from the data.
 */
function staticRootList(): Plugin {
  return {
    name: 'static-root-list',
    transformIndexHtml(html) {
      const roots = JSON.parse(readFileSync('public/data/index.json', 'utf8')) as IndexEntry[];
      const items = roots
        .map((r) => `<li><b>${escape(r.forms.join(', '))}</b> (${escape(r.meaning.en ?? '')}): ${escape(r.words.join(', '))}</li>`)
        .join('\n        ');
      return html.replace('<!--static-root-list-->', items);
    },
  };
}

// Relative base: the same build works at /specroots/ on GitHub Pages and at / locally.
export default defineConfig({
  base: './',
  build: { outDir: 'dist', emptyOutDir: true },
  plugins: [staticRootList()],
});
