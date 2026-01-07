import { describe, expect, test } from "bun:test";
import { buildRoutePath, extractMethodFromFilename } from "@core/router";
import path from "node:path";

describe("router path parsing", () => {
  test("extracts method suffix", () => {
    expect(extractMethodFromFilename("index.get.ts")).toBe("GET");
    expect(extractMethodFromFilename("users.post.ts")).toBe("POST");
    expect(extractMethodFromFilename("users.ts")).toBe(null);
  });

  test("builds route path with index", () => {
    expect(buildRoutePath("index.get.ts")).toBe("/");
    expect(buildRoutePath(path.join("users", "index.get.ts"))).toBe("/users");
  });

  test("builds route path with params", () => {
    expect(buildRoutePath(path.join("users", "[id].get.ts"))).toBe("/users/[id]");
    expect(buildRoutePath(path.join("api", "[...all].get.ts"))).toBe("/api/[...all]");
  });
});
