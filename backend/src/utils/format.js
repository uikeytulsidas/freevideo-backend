const { MAX_QUALITY } = require('../config');

const QUALITY_LEVELS = [240, 360, 480, 720, 1080, 1440, 2160, 4320];
const AUDIO_BITRATES = [128, 192, 256, 320];

function clampQuality(value) {
  const quality = Number.parseInt(value, 10);
  if (!Number.isFinite(quality)) return Math.min(720, MAX_QUALITY);

  return Math.min(Math.max(quality, 240), MAX_QUALITY);
}

function clampAudioBitrate(value) {
  const bitrate = Number.parseInt(value, 10);
  if (!Number.isFinite(bitrate)) return 320;
  if (AUDIO_BITRATES.includes(bitrate)) return bitrate;

  return AUDIO_BITRATES.reduce((closest, current) => {
    return Math.abs(current - bitrate) < Math.abs(closest - bitrate) ? current : closest;
  }, 320);
}

function secondsToTime(seconds) {
  const total = Number(seconds || 0);
  if (!total) return 'Duration unavailable';

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function getFileSizeValue(format) {
  return Number(format?.filesize || format?.filesize_approx || 0);
}

function isEstimatedSize(format) {
  return Boolean(format?.filesize_approx && !format?.filesize);
}

function formatBytes(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return 'Size unavailable';

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const decimals = value >= 100 || unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

function getBestAudioSize(info) {
  const audios = (info.formats || [])
    .filter((format) => format.acodec && format.acodec !== 'none' && (!format.vcodec || format.vcodec === 'none'))
    .map((format) => ({ ...format, size: getFileSizeValue(format) }))
    .filter((format) => format.size > 0)
    .sort((a, b) => (b.abr || 0) - (a.abr || 0) || b.size - a.size);

  const selected = audios[0];
  return {
    bytes: selected?.size || 0,
    estimated: selected ? isEstimatedSize(selected) : false,
    bitrate: selected?.abr || 0,
  };
}

function qualityLabel(quality) {
  const q = Number(quality);
  if (q === 1440) return '1440p / 2K';
  if (q === 2160) return '2160p / 4K';
  if (q === 4320) return '4320p / 8K';
  return `${q}p`;
}

function audioQualityLabel(bitrate) {
  return `${clampAudioBitrate(bitrate)} kbps`;
}

function formatsWithSize(info) {
  return (info.formats || []).map((item) => ({ ...item, size: getFileSizeValue(item) }));
}

function getExactVideoFormats(info, quality) {
  return formatsWithSize(info)
    .filter((item) => item.height === quality && item.vcodec && item.vcodec !== 'none')
    .sort((a, b) => {
      const extScore = (b.ext === 'mp4' ? 1 : 0) - (a.ext === 'mp4' ? 1 : 0);
      if (extScore) return extScore;
      const fpsDiff = (b.fps || 0) - (a.fps || 0);
      if (fpsDiff) return fpsDiff;
      return (b.size || 0) - (a.size || 0);
    });
}

function getBestVideoAtOrBelow(info, quality) {
  return formatsWithSize(info)
    .filter((item) => item.height && item.height <= quality && item.vcodec && item.vcodec !== 'none')
    .sort((a, b) => {
      const heightDiff = (b.height || 0) - (a.height || 0);
      if (heightDiff) return heightDiff;
      const extScore = (b.ext === 'mp4' ? 1 : 0) - (a.ext === 'mp4' ? 1 : 0);
      if (extScore) return extScore;
      const fpsDiff = (b.fps || 0) - (a.fps || 0);
      if (fpsDiff) return fpsDiff;
      return (b.size || 0) - (a.size || 0);
    })[0];
}

function buildMergedSizeResult(videoFormat, audioInfo, fallbackDuration = 0) {
  if (!videoFormat) {
    return { bytes: 0, label: 'Not available', estimated: true, available: false };
  }

  const videoSize = Number(videoFormat.size || 0);
  const audioSize = Number(audioInfo?.bytes || 0);

  if (videoSize > 0 || audioSize > 0) {
    const total = videoSize + audioSize;
    return {
      bytes: total,
      label: formatBytes(total),
      estimated: Boolean(isEstimatedSize(videoFormat) || audioInfo?.estimated || !videoFormat.acodec || videoFormat.acodec === 'none'),
      available: true,
      height: videoFormat.height,
      fps: videoFormat.fps || 0,
    };
  }

  const duration = Number(fallbackDuration || 0);
  const bitrate = Number(videoFormat.tbr || videoFormat.vbr || 0);
  if (duration > 0 && bitrate > 0) {
    const estimatedBytes = Math.round((duration * bitrate * 1000) / 8);
    return {
      bytes: estimatedBytes,
      label: formatBytes(estimatedBytes),
      estimated: true,
      available: true,
      height: videoFormat.height,
      fps: videoFormat.fps || 0,
    };
  }

  return { bytes: 0, label: 'Size unavailable', estimated: true, available: true, height: videoFormat.height, fps: videoFormat.fps || 0 };
}

function getExactQualitySize(info, quality) {
  const candidates = getExactVideoFormats(info, quality);
  const progressive = candidates.find((item) => item.acodec && item.acodec !== 'none' && item.size > 0);
  if (progressive) {
    return {
      bytes: progressive.size,
      label: formatBytes(progressive.size),
      estimated: isEstimatedSize(progressive),
      available: true,
      height: progressive.height,
      fps: progressive.fps || 0,
    };
  }

  const videoOnly = candidates.find((item) => item.size > 0) || candidates[0];
  return buildMergedSizeResult(videoOnly, getBestAudioSize(info), info.duration);
}

function getMp3Size(info, bitrateValue = 320) {
  const bitrate = clampAudioBitrate(bitrateValue);
  const duration = Number(info.duration || 0);

  if (duration > 0) {
    const estimatedBytes = Math.round((duration * bitrate * 1000) / 8);
    return {
      bytes: estimatedBytes,
      label: formatBytes(estimatedBytes),
      estimated: true,
      available: true,
      bitrate,
    };
  }

  const audio = getBestAudioSize(info);
  if (audio.bytes > 0) {
    return {
      bytes: audio.bytes,
      label: formatBytes(audio.bytes),
      estimated: true,
      available: true,
      bitrate,
    };
  }

  return { bytes: 0, label: 'Size unavailable', estimated: true, available: false, bitrate };
}

function getAudioSizeOptions(info) {
  return AUDIO_BITRATES.map((bitrate) => {
    const result = getMp3Size(info, bitrate);
    return {
      bitrate,
      label: result.label,
      bytes: result.bytes,
      estimated: result.estimated,
      available: result.available,
    };
  });
}

function getSelectedFileSize(info, formatType = 'mp4', qualityValue = MAX_QUALITY, audioQualityValue = 320) {
  const format = String(formatType || 'mp4').toLowerCase() === 'mp3' ? 'mp3' : 'mp4';
  const quality = clampQuality(qualityValue);

  if (format === 'mp3') {
    return getMp3Size(info, audioQualityValue);
  }

  const exact = getExactQualitySize(info, quality);
  if (exact.available) return exact;

  const fallback = getBestVideoAtOrBelow(info, quality);
  return buildMergedSizeResult(fallback, getBestAudioSize(info), info.duration);
}

function getQualitySizeOptions(info) {
  return QUALITY_LEVELS
    .filter((quality) => quality <= MAX_QUALITY)
    .map((quality) => {
      const result = getExactQualitySize(info, quality);
      return {
        quality,
        label: result.label,
        bytes: result.bytes,
        estimated: result.estimated,
        available: result.available,
        height: result.height || null,
        fps: result.fps || 0,
      };
    });
}

function getAvailableQualities(info) {
  const exact = getQualitySizeOptions(info)
    .filter((item) => item.available)
    .map((item) => qualityLabel(item.quality));

  return exact;
}

function buildFormatSelector(format, quality) {
  if (format === 'mp3') return 'bestaudio/best';

  const selectedQuality = clampQuality(quality);

  return [
    `bv*[height<=${selectedQuality}][ext=mp4]+ba[ext=m4a]`,
    `b[height<=${selectedQuality}][ext=mp4]`,
    `bv*[height<=${selectedQuality}]+ba`,
    `b[height<=${selectedQuality}]`,
    'best',
  ].join('/');
}

function getSelectedQualityTag(info, formatType = 'mp4', qualityValue = MAX_QUALITY, audioQualityValue = 320) {
  const format = String(formatType || 'mp4').toLowerCase() === 'mp3' ? 'mp3' : 'mp4';
  if (format === 'mp3') return `${clampAudioBitrate(audioQualityValue)}kbps`;

  const quality = clampQuality(qualityValue);
  const selected = getExactVideoFormats(info, quality)[0] || getBestVideoAtOrBelow(info, quality);
  const height = selected?.height || quality;
  const fps = Number(selected?.fps || 0);
  const fpsLabel = fps > 30 ? String(Math.round(fps)) : '';

  return `${height}p${fpsLabel}`;
}

module.exports = {
  QUALITY_LEVELS,
  AUDIO_BITRATES,
  clampQuality,
  clampAudioBitrate,
  secondsToTime,
  getAvailableQualities,
  getQualitySizeOptions,
  getAudioSizeOptions,
  buildFormatSelector,
  formatBytes,
  getSelectedFileSize,
  getSelectedQualityTag,
  qualityLabel,
  audioQualityLabel,
};
