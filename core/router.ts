import path from "node:path";
import type { HttpMethod, ParamMatcher, RouteDefinition, RouteParams, RoutePattern } from "./types";
import { HttpError } from "./errors";

const METHOD_SUFFIXES: Record<string, HttpMethod> = {
  get: "GET",
  post: "POST",
  put: "PUT",
  patch: "PATCH",
  delete: "DELETE",
  options: "OPTIONS",
  head: "HEAD",
};

export function extractMethodFromFilename(file: string): HttpMethod | null {
  const ext = path.extname(file);
  const base = path.basename(file, ext);
  const lastDot = base.lastIndexOf(".");
  if (lastDot === -1) return null;
  const methodSuffix = base.slice(lastDot + 1).toLowerCase();
  return METHOD_SUFFIXES[methodSuffix] ?? null;
}

export function buildRoutePath(relativeFile: string): string {
  const ext = path.extname(relativeFile);
  const withoutExt = relativeFile.slice(0, -ext.length);
  const lastDot = withoutExt.lastIndexOf(".");
  const withoutMethod = lastDot === -1 ? withoutExt : withoutExt.slice(0, lastDot);

  const segments = withoutMethod.split(path.sep).filter(Boolean);
  const mapped = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    if (segment === "index" && isLast) return "";
    return segmentToRouteSegment(segment);
  });

  const pathParts = mapped.filter((part) => part.length > 0);
  return "/" + pathParts.join("/");
}

export function buildRoutePathWithSuffix(relativeFile: string, suffix: string): string {
  const ext = path.extname(relativeFile);
  let withoutExt = relativeFile.slice(0, -ext.length);
  if (withoutExt.endsWith(`.${suffix}`)) {
    withoutExt = withoutExt.slice(0, -(suffix.length + 1));
  }

  const segments = withoutExt.split(path.sep).filter(Boolean);
  const mapped = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    if (segment === "index" && isLast) return "";
    return segmentToRouteSegment(segment);
  });

  const pathParts = mapped.filter((part) => part.length > 0);
  return "/" + pathParts.join("/");
}

export function compileRoutePattern(
  method: HttpMethod,
  routePath: string,
  matchers: Record<string, ParamMatcher>
): RoutePattern {
  const segments = routePath.split("/").filter((seg) => seg.length > 0);
  const paramNames: string[] = [];
  const paramMatchers: (ParamMatcher | undefined)[] = [];

  let pattern = "^";
  if (segments.length === 0) {
    pattern += "/$";
    return { method, regex: new RegExp(pattern), paramNames, paramMatchers };
  }

  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    if (segment.startsWith("[[...") && segment.endsWith("]]") && segment.length > 6) {
      const name = segment.slice(5, -2);
      if (!isLast) {
        throw new Error(`Optional catch-all segment must be last: ${segment}`);
      }
      paramNames.push(name);
      paramMatchers.push(undefined);
      pattern += `(?:/(.*))?`;
      return;
    }

    if (segment.startsWith("[...") && segment.endsWith("]") && segment.length > 5) {
      const name = segment.slice(4, -1);
      paramNames.push(name);
      paramMatchers.push(undefined);
      pattern += "/(.+)";
      return;
    }

    if (segment.startsWith("[") && segment.endsWith("]")) {
      const inner = segment.slice(1, -1);
      const [rawName, matcherName] = inner.split(":");
      const name = rawName.trim();
      const matcher = matcherName ? matchers[matcherName] : undefined;
      if (matcherName && !matcher) {
        throw new Error(`Unknown param matcher: ${matcherName}`);
      }
      paramNames.push(name);
      paramMatchers.push(matcher);
      pattern += "/([^/]+)";
      return;
    }

    pattern += "/" + escapeRegex(segment);
  });

  pattern += "$";
  return { method, regex: new RegExp(pattern), paramNames, paramMatchers };
}

export function matchRoute(
  method: HttpMethod,
  pathname: string,
  routes: RouteDefinition[]
): { route: RouteDefinition; params: RouteParams } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const params = matchPattern(pathname, route.pattern);
    if (!params) continue;
    return { route, params };
  }

  return null;
}

export function getAllowedMethods(pathname: string, routes: RouteDefinition[]): Set<HttpMethod> {
  const allowed = new Set<HttpMethod>();
  for (const route of routes) {
    const params = matchPattern(pathname, route.pattern);
    if (!params) continue;
    allowed.add(route.method);
  }
  return allowed;
}

function matchPattern(pathname: string, pattern: RoutePattern): RouteParams | null {
  const match = pattern.regex.exec(pathname);
  if (!match) return null;

  const params: RouteParams = {};
  const values = match.slice(1);

  for (let i = 0; i < values.length; i += 1) {
    const name = pattern.paramNames[i];
    const matcher = pattern.paramMatchers[i];
    const raw = values[i];
    if (!name) continue;
    if (raw === undefined || raw === "") {
      params[name] = undefined;
      continue;
    }
    let value: string;
    try {
      value = decodeURIComponent(raw);
    } catch {
      throw new HttpError(400, "Invalid URL encoding");
    }
    if (matcher && !matcher(value)) {
      return null;
    }
    params[name] = value;
  }

  return params;
}

export function matchPath(pathname: string, pattern: RoutePattern): RouteParams | null {
  return matchPattern(pathname, pattern);
}

function segmentToRouteSegment(segment: string): string {
  return segment;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
