# hls-proxy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Slack](http://slack.streamingtech.se/badge.svg)](http://slack.streamingtech.se)

Node library to intercept and proxy HLS requests.

With this library you can easily set up a proxy server to intercept and change the contents of an HLS manifest.

## Installation

```
npm install --save @eyevinn/hls-proxy
```

## Usage

Setup a proxy and provide request handlers.

```
const { HLSProxy } = require("@eyevinn/hls-proxy");

const proxy = new HLSProxy(handlers);
proxy.listen(process.env.PORT || 8000);
```

When a client requests a HLS to `http://localhost:8000/example/master.m3u8` the following will happen:

1. Client will request the master manifest `/example/master.m3u8` from the proxy
2. The `handlers.originHandler(request)` is called is expected to return the base URL (`ORIGINBASE`) for origin requests.
3. The master manifest is then fetched from `<ORIGINBASE>/example/master.m3u`.
4. Master manifest is parsed and the `handlers.masterManifestHandler()` is called with the parsed manifest as an m3u object. It is expected to return the manifest to be recevied by the client.
5. Client then request a media manifest `/example/2000/2000.m3u8`
6. The origin handler is called as in 2.
7. The media manfiest is then fetched from `<ORIGINBASE>/example/2000/2000.m3u8`
8. Media manifest is parsed and the `handlers.mediaManifestHandler()` is called with the parsed media manifest as an m3u object. The handler is expected to return the manifest for the client.
9. If the URLs to the segments have not been altered in the media manifest handler and a client tries to retrieve a segment from the proxy the following additional steps will take place.
10. The origin handler is called as in 2.
11. Then the `segmentRedirectHandler()` is called and this handler is expected to return the URL to the segment. A 302 redirect to this URL is then sent to the client.

## Example

```
const { HLSProxy } = require("@eyevinn/hls-proxy");
const proxy = new HLSProxy({
  originHandler: async () => {
    return "https://maitv-vod.lab.eyevinn.technology";
  },
  handleSegment: async (request, baseUrl) => {
    const redirectUrl = new URL(request.raw.url, baseUrl);
    return redirectUrl.href;
  }
});
proxy.listen(8000);
```

Point the video player to `http://localhost:8000/VINN.mp4/master.m3u8` and it will fetch all manifests via the proxy and segment requests are redirected to `https://maitv-vod.lab.eyevinn.technology`.

See `examples/rewrite.js` for a working example where the segment URLs in the media manifest is rewritten to the origin URLs. And in `examples/redirect.js` you find an example of a 302 redirect.

## Handlers interface

```
interface IHandlers {
  originHandler: (request: IProxyRequest) => Promise<string>;
  masterManifestHandler?: (request: IProxyRequest, baseUrl: URL, m3u: any) => Promise<string>;
  mediaManifestHandler?: (request: IProxyRequest, baseUrl: URL, m3u: any) => Promise<string>;
  segmentRedirectHandler?: (request: IProxyRequest, baseUrl: URL) => Promise<string>;
}
```

# About Eyevinn Technology

Eyevinn Technology is an independent consultant firm specialized in video and streaming. Independent in a way that we are not commercially tied to any platform or technology vendor.

At Eyevinn, every software developer consultant has a dedicated budget reserved for open source development and contribution to the open source community. This give us room for innovation, team building and personal competence development. And also gives us as a company a way to contribute back to the open source community.

Want to know more about Eyevinn and how it is to work here. Contact us at work@eyevinn.se!