import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { constants, createReadStream, createWriteStream } from 'node:fs';
import { chmod, link, mkdtemp, open, readFile, realpath, rm, stat } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Transform, Writable } from 'node:stream';

const MAGIC = Buffer.from('SNSD1v1\0');
const HEADER_SIZE = MAGIC.length + 16 + 12;
const TAG_SIZE = 16;
const WRANGLER = resolve('node_modules/wrangler/bin/wrangler.js');

export async function privateDirectory(path) {
  const directory = await realpath(path);
  const info = await stat(directory);
  if (!info.isDirectory() || (info.mode & 0o777) !== 0o700) throw new Error('Private directory must have mode 0700.');
  const inside = relative(await realpath('.'), directory);
  if (inside === '' || (inside !== '..' && !inside.startsWith(`..${sep}`) && !isAbsolute(inside))) throw new Error('Private directory must be outside the repository.');
  return directory;
}

function key(passphrase, salt) {
  if (passphrase.length < 16) throw new Error('Recovery passphrase must be at least 16 characters.');
  return scryptSync(passphrase, salt, 32);
}

async function publish(temp, destination) {
  await link(temp, destination); // Atomic no-overwrite publication.
  await rm(temp);
}

export async function encryptSql(source, destination, passphrase, identity = '', verify = async () => {}) {
  const salt = randomBytes(16);
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(passphrase, salt), nonce);
  cipher.setAAD(Buffer.from(identity));
  const temp = join(dirname(destination), `.${basename(destination)}.${randomBytes(8).toString('hex')}.tmp`);
  try {
    const output = await open(temp, 'wx', 0o600);
    await output.write(Buffer.concat([MAGIC, salt, nonce]));
    await output.close();
    let bytes = 0;
    const count = new Transform({ transform(chunk, _encoding, done) { bytes += chunk.length; done(null, chunk); } });
    await pipeline(typeof source === 'string' ? createReadStream(source) : source, count, cipher, createWriteStream(temp, { flags: 'a', mode: 0o600 }));
    if (bytes === 0) throw new Error('Empty D1 export.');
    const file = await open(temp, 'a');
    await file.write(cipher.getAuthTag());
    await file.close();
    await verify();
    await publish(temp, destination);
  } finally {
    await rm(temp, { force: true });
  }
}

export async function decryptSql(source, destination, passphrase, identity = '') {
  const size = (await stat(source)).size;
  if (size < HEADER_SIZE + TAG_SIZE) throw new Error('Invalid recovery archive.');
  const file = await open(source, 'r');
  let header, tag;
  try {
    header = Buffer.alloc(HEADER_SIZE);
    tag = Buffer.alloc(TAG_SIZE);
    await file.read(header, 0, HEADER_SIZE, 0);
    await file.read(tag, 0, TAG_SIZE, size - TAG_SIZE);
  } finally { await file.close(); }
  if (!header.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error('Invalid recovery archive.');
  const derivedKey = key(passphrase, header.subarray(MAGIC.length, MAGIC.length + 16));
  const decipher = () => {
    const value = createDecipheriv('aes-256-gcm', derivedKey, header.subarray(MAGIC.length + 16));
    value.setAAD(Buffer.from(identity));
    value.setAuthTag(tag);
    return value;
  };
  const temp = join(dirname(destination), `.${basename(destination)}.${randomBytes(8).toString('hex')}.tmp`);
  try {
    // Authenticate before any plaintext reaches the filesystem.
    await pipeline(createReadStream(source, { start: HEADER_SIZE, end: size - TAG_SIZE - 1 }), decipher(), new Writable({ write(_chunk, _encoding, done) { done(); } }));
    await pipeline(createReadStream(source, { start: HEADER_SIZE, end: size - TAG_SIZE - 1 }), decipher(), createWriteStream(temp, { flags: 'wx', mode: 0o600 }));
    await publish(temp, destination);
  } catch (error) {
    if (error?.code === 'EEXIST') throw error;
    throw new Error('Recovery archive authentication failed; no output was published.');
  } finally {
    await rm(temp, { force: true });
  }
}

function promptPassphrase(label) {
  if (!process.stdin.isTTY || !process.stdin.setRawMode) throw new Error('A private terminal is required for passphrase entry.');
  process.stderr.write(label);
  return new Promise((resolvePassphrase, reject) => {
    let value = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const onData = chunk => {
      for (const byte of chunk) {
        if (byte === 3) { finish(new Error('Cancelled.')); return; }
        if (byte === 13 || byte === 10) { finish(); return; }
        if (byte === 127 || byte === 8) value = value.slice(0, -1);
        else if (byte >= 32 && byte <= 126) value += String.fromCharCode(byte);
      }
    };
    const finish = error => {
      process.stdin.off('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stderr.write('\n');
      if (error) reject(error); else resolvePassphrase(value);
    };
    process.stdin.on('data', onData);
  });
}

function wrangler(args) {
  const result = spawnSync(process.execPath, [WRANGLER, ...args], { cwd: resolve('.'), encoding: 'utf8', env: { ...process.env, WRANGLER_WRITE_LOGS: 'false', WRANGLER_SEND_METRICS: 'false' } });
  if (result.status !== 0) throw new Error('Wrangler identity check failed.');
  return result.stdout;
}

export async function exportIntoEncryptedFifo(args, directory, destination, passphrase, identity) {
  const work = await mkdtemp(join(directory, '.capture-'));
  await chmod(work, 0o700);
  try {
    const fifo = join(work, 'export.sql');
    const made = spawnSync('mkfifo', ['-m', '600', fifo], { stdio: 'ignore' });
    if (made.status !== 0) throw new Error('Could not create private export pipe.');
    // A temporary read/write holder prevents either side from blocking on FIFO open.
    const holder = await open(fifo, constants.O_RDWR | constants.O_NONBLOCK);
    const reader = createReadStream(fifo);
    const child = spawn(process.execPath, [WRANGLER, 'd1', 'export', ...args, '--remote', '--output', fifo, '--skip-confirmation'], { cwd: resolve('.'), stdio: 'ignore', env: { ...process.env, WRANGLER_WRITE_LOGS: 'false', WRANGLER_SEND_METRICS: 'false' } });
    const finished = new Promise(resolveChild => {
      child.on('error', () => { reader.destroy(new Error('Wrangler export failed.')); resolveChild(-1); });
      child.on('close', async code => {
        await holder.close();
        if (code !== 0) reader.destroy(new Error('Wrangler export failed.'));
        resolveChild(code);
      });
    });
    try {
      await encryptSql(reader, destination, passphrase, identity, async () => {
        if (await finished !== 0) throw new Error('Wrangler export failed.');
      });
    } catch (error) {
      child.kill();
      throw error;
    }
  } finally { await rm(work, { recursive: true, force: true }); }
}

async function cli() {
  const [action, ...args] = process.argv.slice(2);
  if (action === 'capture') {
    if (args.length !== 5) throw new Error('Usage: capture CONFIG DATABASE UUID PRIVATE_DIR ARCHIVE');
    const [configPath, database, uuid, privateDir, archive] = args;
    if (!/^[0-9a-f-]{36}$/.test(uuid)) throw new Error('Expected exact D1 UUID.');
    const directory = await privateDirectory(privateDir);
    const destination = resolve(archive);
    if (dirname(destination) !== directory) throw new Error('Archive must be directly inside the private directory.');
    if (await stat(destination).then(() => true, () => false)) throw new Error('Archive already exists.');
    const config = JSON.parse(await readFile(configPath, 'utf8'));
    if (config.d1_databases?.length !== 1 || config.d1_databases[0].database_name !== database || config.d1_databases[0].database_id !== uuid) throw new Error('Configuration database identity mismatch.');
    const infoResult = JSON.parse(wrangler(['d1', 'info', database, '--json', '--config', configPath]));
    const info = infoResult.result ?? infoResult;
    if ((info.uuid ?? info.id) !== uuid || info.name !== database) throw new Error('Remote database identity mismatch.');
    const first = await promptPassphrase('Recovery passphrase (input hidden): ');
    const second = await promptPassphrase('Repeat passphrase: ');
    if (first !== second) throw new Error('Passphrases differ.');
    await exportIntoEncryptedFifo([database, '--config', configPath], directory, destination, first, uuid);
    process.stdout.write('Encrypted current-state D1 export saved. Record the source identity and capture time privately.\n');
  } else if (action === 'decrypt') {
    if (args.length !== 4 || args[3] !== '--encrypted-volume-confirmed' || !/^[0-9a-f-]{36}$/.test(args[2])) throw new Error('Usage: decrypt ARCHIVE OUTPUT_SQL SOURCE_UUID --encrypted-volume-confirmed');
    await privateDirectory(dirname(resolve(args[1])));
    if (await stat(resolve(args[1])).then(() => true, () => false)) throw new Error('Decrypted output already exists.');
    const passphrase = await promptPassphrase('Recovery passphrase (input hidden): ');
    await decryptSql(resolve(args[0]), resolve(args[1]), passphrase, args[2]);
    process.stdout.write('Authenticated SQL saved to the requested private path.\n');
  } else throw new Error('Usage: capture CONFIG DATABASE UUID PRIVATE_DIR ARCHIVE | decrypt ARCHIVE OUTPUT_SQL');
}

if (process.argv[1] && resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  cli().catch(() => { process.stderr.write('Recovery command failed. Check the private target, exact database identity, passphrase, and Wrangler status.\n'); process.exitCode = 1; });
}
