const { HLSProxy } = require("../dist/index.js");

const handleOrigin = async (request) => {
  // decide origin url
  const originUrl = new URL("https://maitv-vod.lab.eyevinn.technology");
  return originUrl.href;
}

const handleSegment = async (request, baseUrl) => {
  // redirect segment request to origin
  const redirectUrl = new URL(request.raw.url, baseUrl);
  return redirectUrl.href;
}

const proxy = new HLSProxy({
  originHandler: handleOrigin,
  segmentRedirectHandler: handleSegment
});
proxy.listen(process.env.PORT || 8000);
