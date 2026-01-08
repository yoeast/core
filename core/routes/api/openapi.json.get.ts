/**
 * OpenAPI specification endpoint.
 * 
 * GET /api/openapi.json
 * 
 * Returns the auto-generated OpenAPI 3.0 specification for all API routes.
 */
import { Controller, getLoadedRoutes, generateOpenApiSpec } from "@core";

export default class OpenApiController extends Controller {
  protected override async handle(): Promise<Response> {
    const routes = getLoadedRoutes();
    const spec = generateOpenApiSpec(routes);
    
    return this.json(spec);
  }
}
