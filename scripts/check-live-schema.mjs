import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

// Compare the existing baseline, before the six audit migrations. Never mutates the live DB.
const db = new PGlite({extensions: {pgcrypto}});
try {
  await db.exec(await fs.readFile('tests/platform-fixture.sql', 'utf8'));
  await db.exec('create extension pgcrypto with schema extensions');
  const files = (await fs.readdir('supabase/migrations')).filter(name => name.endsWith('.sql') && name < '20261006').sort();
  for (const name of files) await db.exec(await fs.readFile(`supabase/migrations/${name}`, 'utf8'));
  const local = (await db.query(await fs.readFile('scripts/schema-catalog.sql', 'utf8'))).rows;
  const raw = JSON.parse(await fs.readFile(process.argv[2] || 'tmp/live-schema-before-audit.json', 'utf8'));
  const live = Array.isArray(raw) ? raw : raw.rows ?? raw.result;
  if (!Array.isArray(live)) throw new Error('Live schema output does not contain rows');
  const key = row => `${row.kind}:${row.key}`;
  const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;
  const normalize = row => {
    const value = structuredClone(row.value);
    // Managed ownership differs from the fixture. ACL differences remain visible.
    if (row.kind === 'function') delete value.owner;
    return JSON.stringify(ordered(value)).replace(/\\n|\\r|\\t|\s+/g, '');
  };
  const remote = new Map(live.map(row => [key(row), row]));
  const differences = [];
  for (const row of local) {
    const other = remote.get(key(row));
    if (!other) differences.push({object:key(row), status:'missing-live', local:row.value});
    else if (normalize(row) !== normalize(other)) differences.push({object:key(row), status:'different', local:row.value, live:other.value});
    remote.delete(key(row));
  }
  for (const row of remote.values()) differences.push({object:key(row), status:'live-only', live:row.value});
  await fs.writeFile('tmp/live-schema-differences.json', JSON.stringify(differences, null, 2));
  // Never silently accept provider ACL differences; emit the original details for review.
  const functionReview = differences.filter(row => row.status === 'different' && row.object.startsWith('function:')).map(row => ({
    object:row.object,
    definitionEqual:row.local.definition.replace(/\s+/g,'') === row.live.definition.replace(/\s+/g,''),
    localAcl:row.local.acl,
    liveAcl:row.live.acl,
  }));
  await fs.writeFile('tmp/live-schema-function-review.json', JSON.stringify(functionReview, null, 2));
  console.log(JSON.stringify({baselineMigrations:files.length, localObjects:local.length, liveObjects:live.length, differenceCount:differences.length, differences:differences.slice(0,60).map(({object,status})=>({object,status}))}, null, 2));
  if (differences.length) process.exitCode = 1;
} finally { await db.close(); }
