export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

export type ParamMatcher = (value: string) => boolean;

export type SchemaLike<T> =
  | { parse: (input: unknown) => T }
  | { safeParse: (input: unknown) => { success: boolean; data: T; error: unknown } }
  | ((input: unknown) => T);

export type RouteParams = Record<string, string | undefined>;

export interface RoutePattern {
  method: HttpMethod;
  regex: RegExp;
  paramNames: string[];
  paramMatchers: (ParamMatcher | undefined)[];
}

export interface RouteDefinition {
  method: HttpMethod;
  path: string;
  pattern: RoutePattern;
  Controller: ControllerConstructor;
}

export type ControllerConstructor = new () => {
  run: (req: Request, params: RouteParams, query: URLSearchParams) => Promise<Response>;
};

export interface RealtimeRouteDefinition<TController> {
  path: string;
  pattern: RoutePattern;
  Controller: TController;
}
