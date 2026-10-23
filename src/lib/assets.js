// Resolves an original asset by its file name from the saved page's _files folder.
// Drop the files into src/assets/ and every slot picks them up — no code change.
const files = import.meta.glob('../assets/**/*', { eager: true, query: '?url', import: 'default' });

const byName = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop(), url]),
);

export function assetUrl(fileName) {
  if (!fileName) return null;
  return byName[fileName] ?? byName[fileName + '.svg'] ?? null;
}
