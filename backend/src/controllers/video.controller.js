// const path = require('path');
// const { v4: uuidv4 } = require('uuid');
// const { DOWNLOAD_DIR, FILE_TTL_MINUTES, MAX_QUALITY, PUBLIC_BACKEND_URL } = require('../config');
// const { validatePublicUrl } = require('../utils/urlValidator');
// const { detectPlatform } = require('../utils/platform');
// const { clampQuality, clampAudioBitrate, secondsToTime, getAvailableQualities, getQualitySizeOptions, getAudioSizeOptions, buildFormatSelector, getSelectedFileSize, getSelectedQualityTag } = require('../utils/format');
// const { safeFileName, buildDownloadFileName, getDownloadDisplayName, findDownloadedFile, fileExists } = require('../utils/file');
// const { getVideoInfo, downloadWithYtDlp } = require('../services/ytdlp.service');

// function healthCheck(_req, res) {
//   res.json({
//     success: true,
//     status: 'ok',
//   });
// }

// async function analyzeVideo(req, res) {
//   try {
//     const validation = validatePublicUrl(req.body.url);
//     if (!validation.ok) {
//       return res.status(400).json({ success: false, message: validation.message });
//     }

//     const requestedFormat = String(req.body.format || 'mp4').toLowerCase() === 'mp3' ? 'mp3' : 'mp4';
//     const requestedQuality = clampQuality(req.body.quality || 720);
//     const requestedAudioQuality = clampAudioBitrate(req.body.audioQuality || 320);
//     const info = await getVideoInfo(validation.url);
//     const selectedSize = getSelectedFileSize(info, requestedFormat, requestedQuality, requestedAudioQuality);
//     const selectedQualityTag = getSelectedQualityTag(info, requestedFormat, requestedQuality, requestedAudioQuality);

//     return res.json({
//       success: true,
//       platform: detectPlatform(validation.hostname, info.extractor_key || info.extractor),
//       title: info.title || 'Public video detected',
//       thumbnail: info.thumbnail || '',
//       duration: secondsToTime(info.duration),
//       fileSize: selectedSize.label,
//       fileSizeBytes: selectedSize.bytes,
//       fileSizeEstimated: selectedSize.estimated,
//       selectedFormat: requestedFormat,
//       selectedQuality: requestedQuality,
//       selectedAudioQuality: requestedAudioQuality,
//       selectedQualityTag,
//       webpageUrl: info.webpage_url || validation.url,
//       availableQualities: getAvailableQualities(info),
//       qualitySizes: getQualitySizeOptions(info),
//       audioSizes: getAudioSizeOptions(info),
//       maxQuality: `${MAX_QUALITY}p`,
//       note:
//         'Only public videos you own or have permission to download are supported. Private, login-only, and DRM-protected content is not supported.',
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Could not analyze this video. Make sure the URL is public and supported.',
//       error: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
//     });
//   }
// }

// async function prepareDownload(req, res) {
//   try {
//     const validation = validatePublicUrl(req.body.url);
//     if (!validation.ok) {
//       return res.status(400).json({ success: false, message: validation.message });
//     }

//     const requestedFormat = String(req.body.format || 'mp4').toLowerCase();
//     const format = requestedFormat === 'mp3' ? 'mp3' : 'mp4';
//     const quality = clampQuality(req.body.quality);
//     const audioQuality = clampAudioBitrate(req.body.audioQuality || 320);

//     const info = await getVideoInfo(validation.url);
//     const qualityTag = getSelectedQualityTag(info, format, quality, audioQuality);
//     const id = uuidv4();
//     const cleanTitle = safeFileName(info.title || 'video', 130);
//     const displayFilename = buildDownloadFileName(cleanTitle, qualityTag, format === 'mp3' ? 'mp3' : 'mp4');
//     const storageBaseName = safeFileName(`${cleanTitle}_${qualityTag}`, 170);
//     const prefix = `${id}-${storageBaseName}`;
//     const outputTemplate = path.join(DOWNLOAD_DIR, `${prefix}.%(ext)s`);

//     const options = {
//       output: outputTemplate,
//       noWarnings: true,
//       noPlaylist: true,
//       restrictFilenames: false,
//       windowsFilenames: true,
//       format: buildFormatSelector(format, quality),
//     };

//     if (format === 'mp4') {
//       options.mergeOutputFormat = 'mp4';
//     } else {
//       options.extractAudio = true;
//       options.audioFormat = 'mp3';
//       options.audioQuality = `${audioQuality}K`;
//     }

//     await downloadWithYtDlp(validation.url, options);

//     const downloadedPath = await findDownloadedFile(prefix);
//     if (!downloadedPath) {
//       return res.status(500).json({
//         success: false,
//         message: 'Download finished, but file was not found.',
//       });
//     }

//     const internalFilename = path.basename(downloadedPath);

//     return res.json({
//       success: true,
//       filename: displayFilename,
//       internalFilename,
//       downloadUrl: `${PUBLIC_BACKEND_URL}/api/file/${encodeURIComponent(internalFilename)}?name=${encodeURIComponent(displayFilename)}`,
//       expiresInMinutes: FILE_TTL_MINUTES,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: 'Could not prepare download. Check that the video is public and ffmpeg is installed for MP3/merged MP4.',
//       error: process.env.NODE_ENV === 'development' ? String(error.message || error) : undefined,
//     });
//   }
// }

// async function downloadFile(req, res) {
//   const filename = path.basename(req.params.filename);
//   const filePath = path.join(DOWNLOAD_DIR, filename);

//   if (!(await fileExists(filePath))) {
//     return res.status(404).json({
//       success: false,
//       message: 'File expired or not found.',
//     });
//   }

//   const displayName = getDownloadDisplayName(filename, req.query.name);

//   res.setHeader('X-Content-Type-Options', 'nosniff');
//   return res.download(filePath, displayName);
// }

// module.exports = {
//   healthCheck,
//   analyzeVideo,
//   prepareDownload,
//   downloadFile,
// };


const path = require('path');
const { v4: uuidv4 } = require('uuid');

const {
  DOWNLOAD_DIR,
  FILE_TTL_MINUTES,
  MAX_QUALITY,
  PUBLIC_BACKEND_URL,
  YTDLP_DEBUG,
} = require('../config');

const { validatePublicUrl } = require('../utils/urlValidator');
const { detectPlatform } = require('../utils/platform');

const {
  clampQuality,
  clampAudioBitrate,
  secondsToTime,
  getAvailableQualities,
  getQualitySizeOptions,
  getAudioSizeOptions,
  buildFormatSelector,
  getSelectedFileSize,
  getSelectedQualityTag,
} = require('../utils/format');

const {
  safeFileName,
  buildDownloadFileName,
  getDownloadDisplayName,
  findDownloadedFile,
  fileExists,
} = require('../utils/file');

const {
  getVideoInfo,
  downloadWithYtDlp,
  checkYtDlp,
} = require('../services/ytdlp.service');

function publicErrorDetails(error) {
  if (!YTDLP_DEBUG) {
    return undefined;
  }

  return {
    message: String(error?.message || error || ''),
    stderr: error?.stderr ? String(error.stderr).slice(0, 2500) : undefined,
    stdout: error?.stdout ? String(error.stdout).slice(0, 1000) : undefined,
    command: error?.command,
  };
}

async function healthCheck(_req, res) {
  const ytDlp = await checkYtDlp();

  res.json({
    success: true,
    status: 'ok',
    ytDlp,
  });
}

async function analyzeVideo(req, res) {
  try {
    const validation = validatePublicUrl(req.body.url);

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const requestedFormat =
      String(req.body.format || 'mp4').toLowerCase() === 'mp3'
        ? 'mp3'
        : 'mp4';

    const requestedQuality = clampQuality(req.body.quality || 720);
    const requestedAudioQuality = clampAudioBitrate(req.body.audioQuality || 320);

    const info = await getVideoInfo(validation.url);

    const selectedSize = getSelectedFileSize(
      info,
      requestedFormat,
      requestedQuality,
      requestedAudioQuality
    );

    const selectedQualityTag = getSelectedQualityTag(
      info,
      requestedFormat,
      requestedQuality,
      requestedAudioQuality
    );

    return res.json({
      success: true,
      platform: detectPlatform(validation.hostname, info.extractor_key || info.extractor),
      title: info.title || 'Public video detected',
      thumbnail: info.thumbnail || '',
      duration: secondsToTime(info.duration),

      fileSize: selectedSize.label,
      fileSizeBytes: selectedSize.bytes,
      fileSizeEstimated: selectedSize.estimated,

      selectedFormat: requestedFormat,
      selectedQuality: requestedQuality,
      selectedAudioQuality: requestedAudioQuality,
      selectedQualityTag,

      webpageUrl: info.webpage_url || validation.url,
      availableQualities: getAvailableQualities(info),
      qualitySizes: getQualitySizeOptions(info),
      audioSizes: getAudioSizeOptions(info),
      maxQuality: `${MAX_QUALITY}p`,

      note:
        'Only public videos you own or have permission to download are supported. Private, login-only, and DRM-protected content is not supported.',
    });
  } catch (error) {
    console.error('[api/info] analyze failed:', error);

    return res.status(500).json({
      success: false,
      message: 'Could not analyze this video. Make sure the URL is public and supported.',
      details: publicErrorDetails(error),
    });
  }
}

async function prepareDownload(req, res) {
  try {
    const validation = validatePublicUrl(req.body.url);

    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const requestedFormat = String(req.body.format || 'mp4').toLowerCase();
    const format = requestedFormat === 'mp3' ? 'mp3' : 'mp4';

    const quality = clampQuality(req.body.quality);
    const audioQuality = clampAudioBitrate(req.body.audioQuality || 320);

    const info = await getVideoInfo(validation.url);

    const qualityTag = getSelectedQualityTag(info, format, quality, audioQuality);
    const id = uuidv4();

    const cleanTitle = safeFileName(info.title || 'video', 130);
    const displayFilename = buildDownloadFileName(
      cleanTitle,
      qualityTag,
      format === 'mp3' ? 'mp3' : 'mp4'
    );

    const storageBaseName = safeFileName(`${cleanTitle}_${qualityTag}`, 170);
    const prefix = `${id}-${storageBaseName}`;
    const outputTemplate = path.join(DOWNLOAD_DIR, `${prefix}.%(ext)s`);

    const options = {
      output: outputTemplate,
      noWarnings: true,
      noPlaylist: true,
      restrictFilenames: false,
      windowsFilenames: true,
      format: buildFormatSelector(format, quality),
    };

    if (format === 'mp4') {
      options.mergeOutputFormat = 'mp4';
    } else {
      options.extractAudio = true;
      options.audioFormat = 'mp3';
      options.audioQuality = `${audioQuality}K`;
    }

    await downloadWithYtDlp(validation.url, options);

    const downloadedPath = await findDownloadedFile(prefix);

    if (!downloadedPath) {
      return res.status(500).json({
        success: false,
        message: 'Download finished, but file was not found.',
      });
    }

    const internalFilename = path.basename(downloadedPath);

    return res.json({
      success: true,
      filename: displayFilename,
      internalFilename,
      downloadUrl: `${PUBLIC_BACKEND_URL}/api/file/${encodeURIComponent(
        internalFilename
      )}?name=${encodeURIComponent(displayFilename)}`,
      expiresInMinutes: FILE_TTL_MINUTES,
    });
  } catch (error) {
    console.error('[api/download] prepare failed:', error);

    return res.status(500).json({
      success: false,
      message:
        'Could not prepare download. Check that the video is public and ffmpeg is installed for MP3/merged MP4.',
      details: publicErrorDetails(error),
    });
  }
}

async function downloadFile(req, res) {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(DOWNLOAD_DIR, filename);

  if (!(await fileExists(filePath))) {
    return res.status(404).json({
      success: false,
      message: 'File expired or not found.',
    });
  }

  const displayName = getDownloadDisplayName(filename, req.query.name);

  res.setHeader('X-Content-Type-Options', 'nosniff');

  return res.download(filePath, displayName);
}

module.exports = {
  healthCheck,
  analyzeVideo,
  prepareDownload,
  downloadFile,
};