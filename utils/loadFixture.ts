import * as fs from 'fs';
import * as path from 'path';

/**
 * Load a JSON fixture from the project's `fixtures/` directory. Test
 * data with fixed shapes (FHIR resources, expected response bodies)
 * lives in `fixtures/*.json`; this helper reads + parses them with
 * the path resolved relative to the project root.
 */
export function loadFixture<T = unknown>(name: string): T {
  const filePath = path.resolve(__dirname, '..', 'fixtures', `${name}.json`);
  const contents = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(contents) as T;
}

/** Stringify a fixture as pretty-printed JSON (for display). */
export function dumpFixture(name: string): string {
  return JSON.stringify(loadFixture(name), null, 2);
}
