import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import JSZip from 'jszip';
const root = new URL('../', import.meta.url);
const release = JSON.parse(await readFile(new URL('release.json', root), 'utf8'));
for (const browser of ['chrome', 'edge', 'firefox']) {
  test(`${browser}: published package checksum and contents match the standalone build`, async () => {
    const info = release.packages[browser];
    const bytes = await readFile(new URL(`packages/${info.filename}`, root));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), info.sha256);
    const zip = await JSZip.loadAsync(bytes, { checkCRC32: true });
    const files = Object.keys(zip.files).filter(name => !zip.files[name].dir).sort();
    assert.deepEqual(files, info.files);
    const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
    assert.equal(manifest.version, release.version);
    assert.equal(manifest.permissions, undefined);
    for (const name of files) {
      assert.ok(!name.startsWith('/') && !name.split('/').includes('..'));
      assert.deepEqual(await zip.file(name).async('nodebuffer'), await readFile(new URL(`dist/${browser}/${name}`, root)));
    }
    const checksums = await readFile(new URL(`packages/${release.checksumFile}`, root), 'utf8');
    assert.ok(checksums.includes(`${info.sha256}  ${info.filename}`));
  });
}
