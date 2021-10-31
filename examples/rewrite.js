const { HLSProxy } = require("../dist/index.js");

const handleOrigin = async (request) => {
  // decide origin url
  const originUrl = new URL("https://maitv-vod.lab.eyevinn.technology");
  return originUrl.href;
}

const masterManifestHandler = async (request, baseUrl, m3u) => {
  // do stuff with origin master manifest
  return m3u.toString();
}

const mediaManifestHandler = async (request, baseUrl, m3u) => {
  // add origin base url on all segment url:s
  m3u.items.PlaylistItem.map(playlistItem => {
    const segmentUri = playlistItem.properties.uri;
    const newSegmentUri = new URL(request.basePath + segmentUri, baseUrl.href);
    playlistItem.properties.uri = newSegmentUri.href;
  });
  return m3u.toString();
}

const proxy = new HLSProxy({
  originHandler: handleOrigin,
  masterManifestHandler: masterManifestHandler,
  mediaManifestHandler: mediaManifestHandler,
});
proxy.listen(process.env.PORT || 8000);
