export abstract class Middleware {
  async handle(req: Request, next: () => Promise<Response>): Promise<Response> {
    return next();
  }
}

export type MiddlewareConstructor = new () => Middleware;

/**
 * Apply middleware chain to a request.
 * Accepts either pre-instantiated middleware or constructors.
 */
export async function applyMiddleware(
  middlewares: (Middleware | MiddlewareConstructor)[],
  req: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  let index = -1;

  const dispatch = async (i: number): Promise<Response> => {
    if (i <= index) {
      throw new Error("next() called multiple times");
    }
    index = i;

    const item = middlewares[i];
    if (!item) {
      return handler();
    }

    // Support both instances and constructors
    const instance = typeof item === "function" ? new item() : item;
    return instance.handle(req, () => dispatch(i + 1));
  };

  return dispatch(0);
}
