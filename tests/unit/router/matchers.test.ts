import { describe, expect, test } from "bun:test";
import { compileRoutePattern, matchRoute } from "@yoeast/core/router";
import type { RouteDefinition } from "@yoeast/core/types";

const numberMatcher = (value: string) => /^\d+$/.test(value);

function makeRoute(path: string, method: "GET" = "GET"): RouteDefinition {
  const pattern = compileRoutePattern(method, path, { number: numberMatcher });
  return {
    method,
    path,
    pattern,
    Controller: class {
      async run(): Promise<Response> {
        return new Response("ok");
      }
    },
  };
}

describe("route matchers", () => {
  test("matches dynamic param", () => {
    const route = makeRoute("/users/[id]");
    const match = matchRoute("GET", "/users/123", [route]);
    expect(match?.params.id).toBe("123");
  });

  test("enforces matcher", () => {
    const route = makeRoute("/users/[id:number]");
    const ok = matchRoute("GET", "/users/123", [route]);
    const bad = matchRoute("GET", "/users/abc", [route]);
    expect(ok?.params.id).toBe("123");
    expect(bad).toBe(null);
  });

  test("matches catch-all", () => {
    const route = makeRoute("/files/[...path]");
    const match = matchRoute("GET", "/files/a/b/c", [route]);
    expect(match?.params.path).toBe("a/b/c");
  });

  test("matches optional catch-all", () => {
    const route = makeRoute("/docs/[[...slug]]");
    const empty = matchRoute("GET", "/docs", [route]);
    const full = matchRoute("GET", "/docs/a/b", [route]);
    expect(empty?.params.slug).toBeUndefined();
    expect(full?.params.slug).toBe("a/b");
  });
});

test("unknown matcher name should cause route compilation failure", () => {
  expect(() => compileRoutePattern("GET", "/items/[id:missing]", {})).toThrow();
});

test("invalid percent-encoding throws HttpError", () => {
  const route = makeRoute("/users/[id]");
  expect(() => matchRoute("GET", "/users/%E0%A4%A", [route])).toThrow("Invalid URL encoding");
});
