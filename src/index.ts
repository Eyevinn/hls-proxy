import fastify, { FastifyInstance, FastifyRequest } from "fastify";
import fetch from "node-fetch";
import m3u8 from "@eyevinn/m3u8";

interface IProxyRequest {
  raw: FastifyRequest;
  basePath: string;
};

interface IHandlers {
  originHandler: (request: IProxyRequest) => Promise<string>;
  masterManifestHandler?: (request: IProxyRequest, baseUrl: URL, m3u: any) => Promise<string>;
  mediaManifestHandler?: (request: IProxyRequest, baseUrl: URL, m3u: any) => Promise<string>;
  segmentRedirectHandler?: (request: IProxyRequest, baseUrl: URL) => Promise<string>;
}

export class HLSProxy {
  private server: FastifyInstance;
  private handlers: IHandlers;

  constructor(handlers: IHandlers) {
    this.handlers = handlers;
    this.server = fastify({ ignoreTrailingSlash: true });
    this.server.get("/", async () => {
      return "OK\n";
    });
    this.server.get("/*", async (request, reply) => {
      let basePath;
      const m = request.url.match("^(.*)/.*?$");
      if (m) {
        basePath = m[1] + "/";
      }
      const proxyRequest: IProxyRequest = {
        raw: request,
        basePath: basePath,
      };
      if (!this.handlers.originHandler) {
        throw new Error("No origin handler provided");
      }
      try {
        const originBaseUrl = await this.handlers.originHandler(proxyRequest);
        if (request.url.match(/.m3u8/)) {
          const m3u = await this.fetchAndParseManifest(new URL(request.url, originBaseUrl));
          let manifest = m3u.toString();
          if (request.url.match(/\/master.m3u8/)) {
            if (this.handlers.masterManifestHandler) {
              manifest = await this.handlers.masterManifestHandler(proxyRequest, new URL(originBaseUrl), m3u);
            }
          } else {
            if (this.handlers.mediaManifestHandler) {
              manifest = await this.handlers.mediaManifestHandler(proxyRequest, new URL(originBaseUrl), m3u);
            }
          }
          reply.type("application/x-mpegURL").send(manifest);
        } else {
          if (this.handlers.segmentRedirectHandler) {
            const redirectDest = await this.handlers.segmentRedirectHandler(proxyRequest, new URL(originBaseUrl));
            reply.redirect(302, redirectDest);
          } else {
            reply.code(404).send("Missing segment redirect handler");
          }
        }
      } catch (err) {
        reply.code(500).send(err.message);
      }
    })
  }

  fetchAndParseManifest(url: URL) {
    return new Promise((resolve, reject) => {
      const parser = m3u8.createStream();
      parser.on("m3u", m3u => {
        resolve(m3u);
      });
      parser.on("error", err => {
        reject("Failed to parse master manifest: " + err);
      });
      fetch(url.href)
      .then(response => {
        if (response.status === 200) {
          response.body.pipe(parser);
        } else {
          reject("Failed to fetch master manifest");
        }
      });
    }); 
  }

  listen(port) {
    this.server.listen(port, "0.0.0.0", (err, address) => {
      if (err) {
        throw err;
      }
      console.log(`Server listening at ${address}`);
    });
  }
}
