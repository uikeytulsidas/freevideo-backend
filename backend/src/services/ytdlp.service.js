// const ytDlp = require('yt-dlp-exec');

// async function getVideoInfo(url) {
//   return ytDlp(url, {
//     dumpSingleJson: true,
//     noWarnings: true,
//     noPlaylist: true,
//     skipDownload: true,
//     preferFreeFormats: true,
//   });
// }

// async function downloadWithYtDlp(url, options) {
//   return ytDlp(url, options);
// }

// module.exports = {
//   getVideoInfo,
//   downloadWithYtDlp,
// };



const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const { YTDLP_BIN, YTDLP_TIMEOUT_MS } = require('../config');

const execFileAsync = promisify(execFile);

let resolvedYtDlp = null;
let lastResolveReport = null;

function splitCommand(command) {
  const parts = [];
  const regex = /"([^"]+)"|'([^']+)'|(\S+)/g;
  let match;

  while ((match = regex.exec(String(command || '')))) {
    parts.push(match[1] || match[2] || match[3]);
  }

  return parts;
}

function localPackageBinary() {
  const fileName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';

  return path.join(
    __dirname,
    '..',
    '..',
    'node_modules',
    'yt-dlp-exec',
    'bin',
    fileName
  );
}

function getCandidates() {
  const candidates = [
    YTDLP_BIN,
    'yt-dlp',
    'python3 -m yt_dlp',
    'python -m yt_dlp',
    'py -m yt_dlp',
    localPackageBinary(),
  ]
    .filter(Boolean)
    .map((value) => String(value).trim())
    .filter(Boolean);

  return [...new Set(candidates)];
}

function normalizeCandidate(command) {
  const parts = splitCommand(command);

  if (!parts.length) {
    return null;
  }

  return {
    raw: command,
    file: parts[0],
    baseArgs: parts.slice(1),
  };
}

function cleanErrorText(error) {
  const text =
    error?.stderr ||
    error?.stdout ||
    error?.message ||
    String(error || '');

  return String(text)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2500);
}

async function runCandidate(candidate, args = [], options = {}) {
  const timeout = options.timeout || YTDLP_TIMEOUT_MS;

  const result = await execFileAsync(
    candidate.file,
    [...candidate.baseArgs, ...args],
    {
      timeout,
      maxBuffer: 1024 * 1024 * 80,
      windowsHide: true,
    }
  );

  return result;
}

async function resolveYtDlp() {
  if (resolvedYtDlp) {
    return resolvedYtDlp;
  }

  const attempts = [];

  for (const command of getCandidates()) {
    const candidate = normalizeCandidate(command);

    if (!candidate) {
      continue;
    }

    if (
      candidate.raw.includes(path.sep) &&
      !fs.existsSync(candidate.file)
    ) {
      attempts.push({
        command: candidate.raw,
        ok: false,
        error: 'File does not exist.',
      });
      continue;
    }

    try {
      const result = await runCandidate(candidate, ['--version'], {
        timeout: 15000,
      });

      resolvedYtDlp = {
        ...candidate,
        version: String(result.stdout || '').trim(),
      };

      lastResolveReport = {
        ok: true,
        command: resolvedYtDlp.raw,
        version: resolvedYtDlp.version,
        attempts,
      };

      return resolvedYtDlp;
    } catch (error) {
      attempts.push({
        command: candidate.raw,
        ok: false,
        error: cleanErrorText(error),
      });
    }
  }

  lastResolveReport = {
    ok: false,
    command: null,
    version: null,
    attempts,
  };

  const details = attempts
    .map((item) => `${item.command}: ${item.error}`)
    .join(' | ');

  throw new Error(
    `yt-dlp is not available to the backend. Tried: ${details}`
  );
}

async function checkYtDlp() {
  try {
    const tool = await resolveYtDlp();

    return {
      ok: true,
      command: tool.raw,
      version: tool.version,
    };
  } catch (error) {
    return {
      ok: false,
      error: cleanErrorText(error),
      attempts: lastResolveReport?.attempts || [],
    };
  }
}

function parseJsonOutput(stdout) {
  const text = String(stdout || '').trim();

  if (!text) {
    throw new Error('yt-dlp returned empty response.');
  }

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }

    throw new Error('yt-dlp did not return valid JSON.');
  }
}

async function runYtDlp(args, options = {}) {
  const tool = await resolveYtDlp();

  try {
    const result = await runCandidate(tool, args, options);
    return result;
  } catch (error) {
    const message = cleanErrorText(error);
    const finalError = new Error(message || 'yt-dlp command failed.');
    finalError.stderr = error?.stderr;
    finalError.stdout = error?.stdout;
    finalError.command = tool.raw;
    throw finalError;
  }
}

async function getVideoInfo(url) {
  const result = await runYtDlp(
    [
      url,
      '--dump-single-json',
      '--no-warnings',
      '--no-playlist',
      '--skip-download',
    ],
    {
      timeout: YTDLP_TIMEOUT_MS,
    }
  );

  return parseJsonOutput(result.stdout);
}

function buildDownloadArgs(url, options = {}) {
  const args = [
    url,
    '--no-warnings',
    '--no-playlist',
  ];

  if (options.output) {
    args.push('-o', options.output);
  }

  if (options.format) {
    args.push('-f', options.format);
  }

  if (options.windowsFilenames) {
    args.push('--windows-filenames');
  }

  if (options.restrictFilenames) {
    args.push('--restrict-filenames');
  }

  if (options.mergeOutputFormat) {
    args.push('--merge-output-format', options.mergeOutputFormat);
  }

  if (options.extractAudio) {
    args.push('--extract-audio');
  }

  if (options.audioFormat) {
    args.push('--audio-format', options.audioFormat);
  }

  if (options.audioQuality) {
    args.push('--audio-quality', String(options.audioQuality));
  }

  return args;
}

async function downloadWithYtDlp(url, options) {
  return runYtDlp(buildDownloadArgs(url, options), {
    timeout: YTDLP_TIMEOUT_MS,
  });
}

module.exports = {
  getVideoInfo,
  downloadWithYtDlp,
  checkYtDlp,
};