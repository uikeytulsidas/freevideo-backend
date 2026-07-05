const ytDlp = require('yt-dlp-exec');

async function getVideoInfo(url) {
  return ytDlp(url, {
    dumpSingleJson: true,
    noWarnings: true,
    noPlaylist: true,
    skipDownload: true,
    preferFreeFormats: true,
  });
}

async function downloadWithYtDlp(url, options) {
  return ytDlp(url, options);
}

module.exports = {
  getVideoInfo,
  downloadWithYtDlp,
};
