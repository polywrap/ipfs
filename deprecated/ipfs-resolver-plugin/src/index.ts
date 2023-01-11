import {
  Args_getFile,
  Args_tryResolveUri,
  Bytes,
  CoreClient,
  Ipfs_Module,
  manifest,
  Module,
  UriResolver_MaybeUriOrManifest,
} from "./wrap";

import { PluginFactory, PluginPackage } from "@polywrap/plugin-js";
import isIpfs from "is-ipfs";

type NoConfig = Record<string, never>;

export class IpfsResolverPlugin extends Module<NoConfig> {
  // uri-resolver.core.polywrap.eth
  public async tryResolveUri(
    args: Args_tryResolveUri,
    _client: CoreClient
  ): Promise<UriResolver_MaybeUriOrManifest | null> {
    if (args.authority !== "ipfs") {
      return null;
    }

    if (!IpfsResolverPlugin.isCID(args.path)) {
      // Not a valid CID
      return { manifest: null, uri: null };
    }

    const manifestSearchPattern = "wrap.info";

    let manifest: Bytes | undefined;

    try {
      const manifestResult = await Ipfs_Module.cat(
        {
          cid: `${args.path}/${manifestSearchPattern}`,
          options: {
            timeout: this.env.timeouts?.tryResolveUri,
            disableParallelRequests: this.env.disableParallelRequests,
          },
        },
        _client
      );

      if (manifestResult.ok) {
        manifest = Buffer.from(manifestResult.value);
      }
    } catch (e) {
      // TODO: logging
      // https://github.com/polywrap/monorepo/issues/33
    }

    return { uri: null, manifest: manifest ?? null };
  }

  public async getFile(
    args: Args_getFile,
    client: CoreClient
  ): Promise<Bytes | null> {
    try {
      let provider: string | undefined = undefined;

      if (!this.env.skipCheckIfExists) {
        const resolveResult = await Ipfs_Module.resolve(
          {
            cid: args.path,
            options: {
              timeout: this.env.timeouts?.checkIfExists,
              disableParallelRequests: this.env.disableParallelRequests,
            },
          },
          client
        );

        if (!resolveResult.ok || !resolveResult.value) {
          return null;
        }

        provider = resolveResult.value.provider;
      }

      const catResult = await Ipfs_Module.cat(
        {
          cid: args.path,
          options: {
            provider: provider,
            timeout: this.env.timeouts?.getFile,
            disableParallelRequests: this.env.disableParallelRequests,
          },
        },
        client
      );

      if (!catResult.ok) {
        return null;
      }

      return catResult.value;
    } catch (e) {
      return null;
    }
  }

  private static isCID(cid: string): boolean {
    return isIpfs.cid(cid) || isIpfs.cidPath(cid) || isIpfs.ipfsPath(cid);
  }
}

export const ipfsResolverPlugin: PluginFactory<NoConfig> = () =>
  new PluginPackage(new IpfsResolverPlugin({}), manifest);

export const plugin = ipfsResolverPlugin;
