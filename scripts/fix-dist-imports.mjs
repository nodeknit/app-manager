import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(scriptDir, '..');
const distDir = resolve(rootDir, 'dist');

for (const filePath of walk(distDir)) {
  if (!filePath.endsWith('.js')) {
    continue;
  }

  const original = readFileSync(filePath, 'utf8');
  const updated = original.replace(
    /((?:import|export)\s+(?:[^'"]*?\s+from\s+)?|import\s*\()\s*(['"])(\.{1,2}\/[^'"]+?)\2/g,
    (match, prefix, quote, specifier) => {
      if (hasKnownExtension(specifier)) {
        return match;
      }

      return `${prefix}${quote}${specifier}.js${quote}`;
    }
  );

  if (updated !== original) {
    writeFileSync(filePath, updated);
  }
}

function walk(dirPath) {
  const results = [];

  for (const entry of readdirSync(dirPath)) {
    const entryPath = join(dirPath, entry);
    const entryStat = statSync(entryPath);

    if (entryStat.isDirectory()) {
      results.push(...walk(entryPath));
      continue;
    }

    results.push(entryPath);
  }

  return results;
}

function hasKnownExtension(specifier) {
  return ['.js', '.mjs', '.cjs', '.json', '.node'].some((extension) =>
    specifier.endsWith(extension)
  );
}
