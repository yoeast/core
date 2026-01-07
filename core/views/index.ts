/**
 * View/templating system using Handlebars.
 */

import path from "node:path";
import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import Handlebars from "handlebars";
import { config } from "../config";

let viewsDir: string = "";
let cacheDir: string = "";
let coreDir: string = "";
let cacheEnabled: boolean = true;
let hbs: typeof Handlebars;

// Cache of compiled templates
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Initialize the view system.
 */
export async function initViews(rootDir: string): Promise<void> {
  const viewsPath = config<string>("views.path", "app/views");
  cacheEnabled = config<boolean>("views.cache", true);
  const cachePath = config<string>("views.cachePath", "storage/views");

  viewsDir = path.join(rootDir, viewsPath);
  cacheDir = path.join(rootDir, cachePath);
  coreDir = path.dirname(new URL(import.meta.url).pathname);

  // Create a new Handlebars instance
  hbs = Handlebars.create();

  // Load built-in plugins from core/views/plugins/
  await loadPlugins(path.join(coreDir, "plugins"));

  // Load user plugins from app/views/plugins/
  await loadPlugins(path.join(viewsDir, "plugins"));

  // Register all partials from layouts/ and partials/
  await registerPartials(path.join(viewsDir, "layouts"), "layouts");
  await registerPartials(path.join(viewsDir, "partials"), "partials");

  // Ensure cache directory exists
  if (cacheEnabled) {
    await mkdir(cacheDir, { recursive: true });
  }
}

/**
 * Load plugins (helpers) from a directory.
 * Each plugin file should export a register(hbs) function.
 */
async function loadPlugins(dir: string): Promise<void> {
  try {
    const files = await readdir(dir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile()) continue;
      if (!file.name.endsWith(".ts") && !file.name.endsWith(".js")) continue;
      if (file.name === "index.ts" || file.name === "index.js") continue;

      const filePath = path.join(dir, file.name);
      try {
        const mod = await import(pathToFileURL(filePath).href);

        // If module exports a register function, call it
        if (typeof mod.register === "function") {
          mod.register(hbs);
        }
        // If module has a default export that's a function, call it
        else if (typeof mod.default === "function") {
          mod.default(hbs);
        }
        // Otherwise, register each exported function as a helper
        else {
          for (const [name, fn] of Object.entries(mod)) {
            if (typeof fn === "function" && name !== "default") {
              hbs.registerHelper(name, fn as Handlebars.HelperDelegate);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to load plugin from ${file.name}:`, error);
      }
    }
  } catch (error) {
    // Directory doesn't exist - that's fine
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Register all templates in a directory as partials.
 */
async function registerPartials(dir: string, prefix: string): Promise<void> {
  try {
    const files = await readdir(dir, { withFileTypes: true });

    for (const file of files) {
      if (file.isDirectory()) {
        await registerPartials(path.join(dir, file.name), `${prefix}/${file.name}`);
        continue;
      }

      if (!file.name.endsWith(".html") && !file.name.endsWith(".hbs")) continue;

      const name = file.name.replace(/\.(html|hbs)$/, "");
      const filePath = path.join(dir, file.name);
      const content = await readFile(filePath, "utf-8");
      
      hbs.registerPartial(`${prefix}/${name}`, content);
    }
  } catch (error) {
    // Directory doesn't exist - that's fine
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Get or compile a template.
 */
async function getTemplate(name: string): Promise<HandlebarsTemplateDelegate> {
  // Check memory cache first
  if (cacheEnabled && templateCache.has(name)) {
    return templateCache.get(name)!;
  }

  // Try to load precompiled template from disk cache
  if (cacheEnabled) {
    const cachedPath = path.join(cacheDir, `${name.replace(/\//g, "__")}.js`);
    try {
      const spec = await import(cachedPath);
      const template = hbs.template(spec.default);
      templateCache.set(name, template);
      return template;
    } catch {
      // Not cached, compile it
    }
  }

  // Load and compile template
  const templatePath = path.join(viewsDir, `${name}.html`);
  const content = await readFile(templatePath, "utf-8");
  const template = hbs.compile(content);

  // Cache compiled template
  if (cacheEnabled) {
    templateCache.set(name, template);
    
    // Save precompiled template to disk for persistence across restarts
    try {
      const precompiled = hbs.precompile(content);
      const cachedPath = path.join(cacheDir, `${name.replace(/\//g, "__")}.js`);
      await writeFile(cachedPath, `export default ${precompiled};`);
    } catch {
      // Caching failed, continue without disk cache
    }
  }

  return template;
}

/**
 * Render a view template.
 * 
 * @param name - Template name (relative to views directory)
 * @param data - Data to pass to the template
 * @returns Rendered HTML string
 * 
 * @example
 * await render('pages/home', { title: 'Welcome' })
 */
export async function render(name: string, data: Record<string, unknown> = {}): Promise<string> {
  if (!hbs) {
    throw new Error("Views not initialized. Call initViews() first.");
  }

  try {
    const template = await getTemplate(name);
    return template(data);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to render view '${name}': ${error.message}`);
    }
    throw error;
  }
}

/**
 * Render a view with a layout.
 * 
 * @param name - Template name
 * @param data - Data to pass to the template
 * @param layout - Layout name (defaults to 'layouts/main')
 * @returns Rendered HTML string
 */
export async function renderWithLayout(
  name: string,
  data: Record<string, unknown> = {},
  layout: string = "layouts/main"
): Promise<string> {
  if (!hbs) {
    throw new Error("Views not initialized. Call initViews() first.");
  }

  // Render the content template first
  const content = await render(name, data);

  // Render the layout with the content
  const layoutTemplate = await getTemplate(layout);
  return layoutTemplate({ ...data, content });
}

/**
 * Register a custom helper.
 * 
 * @example
 * registerHelper('uppercase', (str) => str.toUpperCase())
 * // In template: {{uppercase name}}
 */
export function registerHelper(name: string, fn: Handlebars.HelperDelegate): void {
  if (!hbs) {
    throw new Error("Views not initialized. Call initViews() first.");
  }
  hbs.registerHelper(name, fn);
}

/**
 * Register a partial template.
 * 
 * @example
 * registerPartial('myPartial', '<div>{{content}}</div>')
 * // In template: {{> myPartial}}
 */
export function registerPartial(name: string, template: string): void {
  if (!hbs) {
    throw new Error("Views not initialized. Call initViews() first.");
  }
  hbs.registerPartial(name, template);
}

/**
 * Clear the template cache (useful for development).
 */
export function clearViewCache(): void {
  templateCache.clear();
}

/**
 * Get the Handlebars instance for advanced usage.
 */
export function getHandlebars(): typeof Handlebars {
  if (!hbs) {
    throw new Error("Views not initialized. Call initViews() first.");
  }
  return hbs;
}

/**
 * Check if views are initialized.
 */
export function isViewsInitialized(): boolean {
  return hbs !== undefined;
}

/**
 * Get the views directory path.
 */
export function getViewsDir(): string {
  return viewsDir;
}
