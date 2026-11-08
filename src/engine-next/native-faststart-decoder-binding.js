/** Reversible mapping between an authoritative source and an export-only cache.
 * The manifest MUST be verified server-side against actual packet timestamps,
 * source & cache SHA256 and encoded bitstreams. Client metadata alone is NOT
 * an authority. Never change the original project/media URL or use the cache
 * for audio, transcription, edit decisions or asset ownership.
 */
const SHA = /^[a-f0-9]{64}$/;
function validMediaUrl(url) {
  if (typeof url !== 'string' || !url.startsWith('/media/')) return false;
  const encoded = url.slice(7); let decoded;
  try { decoded = decodeURIComponent(encoded); } catch { return false; }
  return !!decoded && decoded.length <= 200 && decoded !== '.' && decoded !== '..' &&
    !/[\\/\x00-\x1f\x7f]/.test(decoded) && encodeURIComponent(decoded) === encoded;
}

/** Build a read-only binding after server-side revalidation of the manifest. */
export function bindVerifiedNativeDecoderCache(manifest, {sourceSha256, cacheSha256, activeMediaSrc}={}) {
  if (!manifest || manifest.schema !== 'sues-native-faststart-cache/v1' ||
      manifest.sourcePreserved !== true || manifest.decoderOnly !== true ||
      manifest.noReencoding !== true || manifest.videoPacketTimelineExact !== true ||
      manifest.audioPacketTimelineExact !== true || manifest.videoBitstreamEqual !== true ||
      manifest.audioBitstreamEqual !== true || manifest.productionActivation !== false ||
      manifest.creativeApproved !== false)
    throw Error('Unverified remux cache provenance, or cache incorrectly activated');
  if (!SHA.test(sourceSha256 || '') || !SHA.test(cacheSha256 || '') ||
      manifest.sourceSha256 !== sourceSha256 || manifest.cacheSha256 !== cacheSha256)
    throw Error('Exact source/cache SHA256 evidence required');
  if (!validMediaUrl(manifest.sourceMediaUrl) || !validMediaUrl(manifest.cacheMediaUrl) ||
      !manifest.sourceMediaUrl.endsWith('.mp4') || !manifest.cacheMediaUrl.endsWith('.mp4') ||
      manifest.sourceMediaUrl === manifest.cacheMediaUrl || activeMediaSrc !== manifest.sourceMediaUrl)
    throw Error('Source media path changed, unbound cache path, or unsupported media URL');
  const from = manifest.sourceMediaUrl, to = manifest.cacheMediaUrl;
  return Object.freeze({
    sourceMediaUrl: from, cacheMediaUrl: to,
    decoderOnly: true,
    sourceSha256,
    resolveVideoDecodeUrl(src) { return src === from ? to : src; },
    preserveProjectMediaUrl(src) { return src; },
  });
}
