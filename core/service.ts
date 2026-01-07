/**
 * Service system for managing application services with lifecycle hooks.
 */

import path from "node:path";
import { readdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

/**
 * Base class for services.
 * Services are singleton instances that manage external resources (databases, caches, etc.)
 */
export abstract class Service {
  /**
   * Called when the service boots.
   * Use this to establish connections, initialize resources, etc.
   */
  abstract boot(): Promise<void>;

  /**
   * Called when the application shuts down.
   * Use this to close connections, cleanup resources, etc.
   */
  async shutdown(): Promise<void> {
    // Default implementation does nothing
  }
}

// Registry of service instances
const services = new Map<string, Service>();

/**
 * Get a service by name.
 * 
 * @example
 * const db = service<DatabaseService>("database");
 * await db.connection.collection("users").find();
 */
export function service<T extends Service = Service>(name: string): T {
  const svc = services.get(name);
  if (!svc) {
    throw new Error(`Service "${name}" not found. Make sure it exists in app/services/`);
  }
  return svc as T;
}

/**
 * Check if a service is registered.
 */
export function hasService(name: string): boolean {
  return services.has(name);
}

/**
 * Get all registered service names.
 */
export function getServiceNames(): string[] {
  return Array.from(services.keys());
}

/**
 * Load and boot all services from app/services/.
 * Called during server startup.
 */
export async function bootServices(rootDir: string): Promise<void> {
  const servicesDir = path.join(rootDir, "app", "services");

  try {
    const files = await readdir(servicesDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;
      if (!file.name.endsWith(".ts") && !file.name.endsWith(".js")) continue;

      const name = file.name.replace(/\.(ts|js)$/, "");
      const filePath = path.join(servicesDir, file.name);

      try {
        const mod = await import(pathToFileURL(filePath).href);
        const ServiceClass = mod.default;

        if (!ServiceClass || !(ServiceClass.prototype instanceof Service)) {
          console.error(`Service ${name} must export a default class extending Service`);
          continue;
        }

        const instance = new ServiceClass();
        await instance.boot();
        services.set(name, instance);
      } catch (error) {
        console.error(`Failed to boot service "${name}":`, error);
        throw error;
      }
    }
  } catch (error) {
    // Directory doesn't exist - that's fine, no services
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Shutdown all services gracefully.
 * Called during server shutdown.
 */
export async function shutdownServices(): Promise<void> {
  const errors: Error[] = [];

  // Shutdown in reverse order of registration
  const serviceNames = Array.from(services.keys()).reverse();

  for (const name of serviceNames) {
    try {
      const svc = services.get(name)!;
      await svc.shutdown();
    } catch (error) {
      errors.push(error as Error);
      console.error(`Failed to shutdown service "${name}":`, error);
    }
  }

  services.clear();

  if (errors.length > 0) {
    throw new AggregateError(errors, "Some services failed to shutdown");
  }
}
