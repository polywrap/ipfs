import { PolywrapClient } from "@polywrap/client-js";
import path from "path";
import fs from "fs";
import * as Ipfs from "./types";
import { TextEncoder } from "util";
import { ipfsProvider, initInfra, stopInfra } from "./utils/infra";
import { defaultIpfsProviders } from "@polywrap/client-config-builder-js";

jest.setTimeout(360000);

describe("IPFS HTTP Client Wrapper", () => {
  const singleFileCid = "QmXjuLkuAKVtfg9ZxhWyLanMZasYwhza2EozCH7cg3VY31";
  const addFileCid = "QmWjGyqGNWMAH9pCXK1nJo2Do68EHLb7zUqt6fHuq5pRU4";
  const encoder = new TextEncoder();

  let client: PolywrapClient;
  let fsUri: string;

  beforeAll(async () => {
    await initInfra();

    // create client
    client = new PolywrapClient({
      envs: [
        {
          uri: "wrap://ens/ipfs.polywrap.eth",
          env: {
            provider: ipfsProvider,
            fallbackProviders: defaultIpfsProviders,
          },
        },
      ]
    })

    const apiPath = path.resolve(path.join(__dirname, "/../../../"));
    fsUri = `wrap://fs/${apiPath}/build`;

    // upload test file
    const buffer: Buffer = fs.readFileSync(path.join(__dirname, "testData", "test.txt"));
    const bytes: Ipfs.Bytes = Uint8Array.from(buffer);
    await client.invoke({
      uri: "wrap://ens/ipfs.polywrap.eth",
      method: "addFile",
      args: {
        data: bytes,
      },
    });
  });

  afterAll(async () => {
    await stopInfra();
  })

  it("addFile", async () => {
    const buffer: Buffer = fs.readFileSync(path.join(__dirname, "testData", "addTest.txt"));
    const bytes: Ipfs.Bytes = Uint8Array.from(buffer);

    const result = await client.invoke<Ipfs.Ipfs_AddResult>({
      uri: fsUri,
      method: "addFile",
      args: {
        data: {
          name: "addTest.txt",
          data: bytes,
        },
        ipfsProvider,
        timeout: 5000,
      }
    });

    if (result.ok === false) fail(result.error);
    expect(result.value.hash).toEqual(addFileCid);
  });

  it("addFile from buffer", async () => {
    const expectedContents = "A new sample file";
    const buffer = Buffer.from(expectedContents, "utf-8");
    const bytes: Ipfs.Bytes = Uint8Array.from(buffer);

    const result = await client.invoke<Ipfs.Ipfs_AddResult>({
      uri: fsUri,
      method: "addFile",
      args: {
        data: {
          name: "addTest.txt",
          data: bytes,
        },
        ipfsProvider,
        timeout: 5000,
      }
    });

    if (result.ok === false) fail(result.error);
    expect(result.value.hash).toEqual("Qmawvzw32Jq7RbMw2K8axEbzfNK74NPynBoq4tJnWvkYqP");
  });

  it("addFile with onlyHash option", async () => {
    const buffer: Buffer = fs.readFileSync(path.join(__dirname, "testData", "addTest.txt"));
    const bytes: Ipfs.Bytes = Uint8Array.from(buffer);

    const result = await client.invoke<Ipfs.Ipfs_AddResult>({
      uri: fsUri,
      method: "addFile",
      args: {
        data: {
          name: "addTest.txt",
          data: bytes,
        },
        ipfsProvider,
        timeout: 5000,
        options: {
          onlyHash: true
        },
      }
    });

    if (result.ok === false) fail(result.error);
    expect(result.value.hash).toEqual(addFileCid);
  });

  it("resolve", async () => {
    const result = await client.invoke<Ipfs.Ipfs_ResolveResult>({
      uri: fsUri,
      method: "resolve",
      args: {
        cid: singleFileCid,
        ipfsProvider,
        timeout: 5000,
      }
    });

    if (result.ok === false) fail(result.error);
    expect(result.value.cid).toEqual("/ipfs/" + singleFileCid);
  });

  it("cat", async () => {
    const buffer: Buffer = fs.readFileSync(path.join(__dirname, "testData", "test.txt"));
    const bytes: Ipfs.Bytes = Uint8Array.from(buffer);

    const result = await client.invoke<Ipfs.Bytes>({
      uri: fsUri,
      method: "cat",
      args: {
        cid: singleFileCid,
        ipfsProvider,
        timeout: 5000,
      }
    });

    if (result.ok === false) fail(result.error);
    expect(result.value).toEqual(bytes);
  });

  it("cat with offset and length", async () => {
    const expected = encoder.encode("From IPFS!");

    const result = await client.invoke<Ipfs.Bytes>({
      uri: fsUri,
      method: "cat",
      args: {
        cid: singleFileCid,
        ipfsProvider,
        timeout: 5000,
        catOptions: {
          offset: 6,
          length: 10,
        },
      }
    });

    if (result.ok === false) fail(result.error);
    expect(result.value).toEqual(expected);
  });

  // TODO: write test for addDir
  // it("addDir", async () => {
  // });
});
