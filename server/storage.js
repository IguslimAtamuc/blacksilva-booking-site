import fs from 'node:fs/promises';
import path from 'node:path';
import { buildDemoBookings } from '../src/booking.js';

const localPath =
  process.env.BOOKINGS_FILE ||
  (process.env.VERCEL ? '/tmp/blacksilva-bookings.json' : path.join(process.cwd(), 'data', 'bookings.json'));

function canUseGitHubStorage() {
  return Boolean(process.env.GITHUB_DATA_REPO && process.env.GITHUB_TOKEN);
}

async function readLocalBookings() {
  try {
    const content = await fs.readFile(localPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const initial = buildDemoBookings();
    await writeLocalBookings(initial);
    return initial;
  }
}

async function writeLocalBookings(bookings) {
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  await fs.writeFile(localPath, `${JSON.stringify(bookings, null, 2)}\n`, 'utf8');
}

async function githubRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'BlackSilva-Booking',
      ...(options.headers || {}),
    },
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    throw new Error(`GitHub storage failed (${response.status}): ${text}`);
  }

  return response;
}

async function readGitHubBookings() {
  const repo = process.env.GITHUB_DATA_REPO;
  const filePath = process.env.GITHUB_DATA_PATH || 'bookings.json';
  const branch = process.env.GITHUB_DATA_BRANCH || 'main';
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(filePath)}?ref=${branch}`;
  const response = await githubRequest(url);

  if (response.status === 404) return buildDemoBookings();

  const payload = await response.json();
  const content = Buffer.from(payload.content || '', 'base64').toString('utf8');
  return JSON.parse(content || '[]');
}

async function writeGitHubBookings(bookings) {
  const repo = process.env.GITHUB_DATA_REPO;
  const filePath = process.env.GITHUB_DATA_PATH || 'bookings.json';
  const branch = process.env.GITHUB_DATA_BRANCH || 'main';
  const encodedPath = encodeURIComponent(filePath);
  const getUrl = `https://api.github.com/repos/${repo}/contents/${encodedPath}?ref=${branch}`;
  const current = await githubRequest(getUrl);
  const sha = current.status === 404 ? undefined : (await current.json()).sha;

  const body = {
    branch,
    message: `Update BlackSilva bookings ${new Date().toISOString()}`,
    content: Buffer.from(`${JSON.stringify(bookings, null, 2)}\n`).toString('base64'),
    ...(sha ? { sha } : {}),
  };

  const putUrl = `https://api.github.com/repos/${repo}/contents/${encodedPath}`;
  await githubRequest(putUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function readBookings() {
  if (canUseGitHubStorage()) return readGitHubBookings();
  return readLocalBookings();
}

export async function writeBookings(bookings) {
  if (canUseGitHubStorage()) return writeGitHubBookings(bookings);
  return writeLocalBookings(bookings);
}
