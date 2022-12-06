import { httpPlugin } from "../..";
import { Http_Response } from "../../wrap";

import { PolywrapClient, UriResolver } from "@polywrap/client-js";
import nock from "nock";

jest.setTimeout(360000);

const defaultReplyHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-credentials": "true",
};

describe("e2e tests for HttpPlugin", () => {
  let polywrapClient: PolywrapClient;

  beforeEach(() => {
    polywrapClient = new PolywrapClient(
      {
        resolver: UriResolver.from({
          uri: "wrap://ens/http.polywrap.eth",
          package: httpPlugin({}),
        }),
      },
      { noDefaults: true }
    );
  });

  describe("get method", () => {
    test("successful request with response type as TEXT", async () => {
      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .get("/api")
        .reply(200, '{data: "test-response"}');

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "get",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "TEXT",
          },
        },
      });
      
      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe('{data: "test-response"}');
      expect(response.value?.headers?.size).toEqual(2); // default reply headers
    });

    test("successful request with response type as BINARY", async () => {
      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .get("/api")
        .reply(200, '{data: "test-response"}');

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "get",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "BINARY",
          },
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe(
        Buffer.from('{data: "test-response"}').toString("base64")
      );
      expect(response.value?.headers?.size).toEqual(2); // default reply headers
    });

    test("successful request with query params and request headers", async () => {
      nock("http://www.example.com", {
        reqheaders: { "X-Request-Header": "req-foo" },
      })
        .defaultReplyHeaders(defaultReplyHeaders)
        .get("/api")
        .query({ query: "foo" })
        .reply(200, '{data: "test-response"}', {
          "X-Response-Header": "resp-foo",
        });

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "get",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "TEXT",
            urlParams: new Map([["query", "foo"]]),
            headers: new Map([["X-Request-Header", "req-foo"]]),
          },
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe('{data: "test-response"}');
      expect(response.value?.headers).toEqual(
        new Map([
          ["x-response-header", "resp-foo"],
          ["access-control-allow-origin", "*"],
          ["access-control-allow-credentials", "true"],
        ])
      );
    });

    test("failed request", async () => {
      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .get("/api")
        .reply(404);

      let response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "get",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "TEXT",
          },
        },
      });

      response = response as { ok: false, error: Error | undefined };
      expect(response.error).toBeDefined();
      expect(response.ok).toBeFalsy();
    });
  });

  describe("post method", () => {
    test("successful request with request type as application/json", async () => {
      const reqPayload = {
        data: "test-request",
      };
      const reqPayloadStringified = JSON.stringify(reqPayload);

      const resPayload = {
        data: "test-response",
      };
      const resPayloadStringfified = JSON.stringify(resPayload);

      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .post("/api", reqPayloadStringified)
        .reply(200, resPayloadStringfified);

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "post",
        args: {
          url: "http://www.example.com/api",
          request: {
            headers: new Map([["Content-Type", "application/json"]]),
            responseType: "TEXT",
            body: `{\"data\":\"test-request\"}`,
          },
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe(resPayloadStringfified);
      expect(response.value?.headers?.size).toEqual(2); // default reply headers
    });

    test("successful request with response type as TEXT", async () => {
      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .post("/api", "{data: 'test-request'}")
        .reply(200, '{data: "test-response"}');

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "post",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "TEXT",
            body: "{data: 'test-request'}",
          },
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe('{data: "test-response"}');
      expect(response.value?.headers?.size).toEqual(2); // default reply headers
    });

    test("successful request with response type as BINARY", async () => {
      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .post("/api", "{data: 'test-request'}")
        .reply(200, '{data: "test-response"}');

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "post",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "BINARY",
            body: "{data: 'test-request'}",
          },
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe(
        Buffer.from('{data: "test-response"}').toString("base64")
      );
      expect(response.value?.headers?.size).toEqual(2); // default reply headers
    });

    test("successful request with query params and request headers", async () => {
      nock("http://www.example.com", {
        reqheaders: { "X-Request-Header": "req-foo" },
      })
        .defaultReplyHeaders(defaultReplyHeaders)
        .post("/api", "{data: 'test-request'}")
        .query({ query: "foo" })
        .reply(200, '{data: "test-response"}', {
          "X-Response-Header": "resp-foo",
        });

      const response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "post",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "TEXT",
            body: "{data: 'test-request'}",
            urlParams: new Map([["query", "foo"]]),
            headers: new Map([["X-Request-Header", "req-foo"]]),
          },
        },
      });

      if (!response.ok) fail(response.error);
      expect(response.value).toBeDefined();
      expect(response.value?.status).toBe(200);
      expect(response.value?.body).toBe('{data: "test-response"}');
      expect(response.value?.headers).toEqual(
        new Map([
          ["x-response-header", "resp-foo"],
          ["access-control-allow-origin", "*"],
          ["access-control-allow-credentials", "true"],
        ])
      );
    });

    test("failed request", async () => {
      nock("http://www.example.com")
        .defaultReplyHeaders(defaultReplyHeaders)
        .post("/api")
        .reply(404);

      let response = await polywrapClient.invoke<Http_Response>({
        uri: "wrap://ens/http.polywrap.eth",
        method: "post",
        args: {
          url: "http://www.example.com/api",
          request: {
            responseType: "TEXT",
          },
        },
      });

      response = response as { ok: false, error: Error | undefined };
      expect(response.error).toBeDefined();
      expect(response.ok).toBeFalsy();
    });
  });
});
