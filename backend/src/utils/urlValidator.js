const { ALLOW_UNLISTED_SITES } = require('../config');
const { SUPPORTED_HOSTS } = require('../constants/platforms');

function isPrivateOrLocalHost(hostname) {
  const host = hostname.toLowerCase();

  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.startsWith('10.') ||
    host.startsWith('192.168.') ||
    host.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function validatePublicUrl(value) {
  if (!value || typeof value !== 'string') {
    return { ok: false, message: 'Video URL is required.' };
  }

  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    return { ok: false, message: 'Please enter a valid URL.' };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, message: 'Only HTTP and HTTPS URLs are allowed.' };
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    return { ok: false, message: 'Local/private URLs are not allowed.' };
  }

  const hostAllowed = SUPPORTED_HOSTS.some(
    (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
  );

  if (!hostAllowed && !ALLOW_UNLISTED_SITES) {
    return {
      ok: false,
      message:
        'This platform is not enabled yet. Enable ALLOW_UNLISTED_SITES=true only if you want yt-dlp to try other public sites.',
    };
  }

  return {
    ok: true,
    url: parsed.toString(),
    hostname: parsed.hostname,
  };
}

module.exports = {
  validatePublicUrl,
  isPrivateOrLocalHost,
};
