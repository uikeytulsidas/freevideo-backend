function detectPlatform(urlOrHost, extractor) {
  const value = String(extractor || urlOrHost || '').toLowerCase();

  if (value.includes('youtube') || value.includes('youtu.be')) return 'YouTube';
  if (value.includes('instagram')) return 'Instagram';
  if (value.includes('facebook') || value.includes('fb.watch')) return 'Facebook';
  if (value.includes('twitter') || value.includes('x.com')) return 'Twitter/X';
  if (value.includes('dailymotion') || value.includes('dai.ly')) return 'Dailymotion';
  if (value.includes('reddit') || value.includes('redd.it')) return 'Reddit';

  return 'Supported website';
}

module.exports = { detectPlatform };
