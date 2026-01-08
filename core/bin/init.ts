#!/usr/bin/env bun
/**
 * Scaffolding CLI for creating a new Core project.
 * Usage: bunx @yoeast/core init [project-name]
 */

import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";

const TEMPLATES: Record<string, string> = {
  "index.ts": `import { startServer } from "@yoeast/core";

await startServer();
`,

  "tsconfig.json": `{
  "compilerOptions": {
    "lib": ["ESNext"],
    "module": "esnext",
    "target": "esnext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "noEmit": true,
    "composite": true,
    "strict": true,
    "downlevelIteration": true,
    "skipLibCheck": true,
    "jsx": "react-jsx",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "allowJs": true,
    "types": ["bun-types"],
    "paths": {
      "@yoeast/core": ["./core/index.ts"],
      "@yoeast/core/*": ["./core/*"]
    }
  }
}
`,

  "bunfig.toml": `[install]
peer = false
`,

  ".env": `PORT=3000
`,

  ".gitignore": `.env
*.log
`,

  "app/routes/index.get.ts": `import { Controller } from "@yoeast/core";

export default class IndexGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({ ok: true, message: "Welcome to Core!" });
  }
}
`,

  "app/routes/health.get.ts": `import { Controller } from "@yoeast/core";

export default class HealthGet extends Controller {
  protected async handle(): Promise<Response> {
    return this.json({
      status: "ok",
      uptimeMs: Math.round(process.uptime() * 1000),
    });
  }
}
`,

  "app/middleware/.gitkeep": "",
  "app/plugins/.gitkeep": "",
  "app/services/.gitkeep": "",
  "app/params/.gitkeep": "",
};

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function init(projectName?: string) {
  const targetDir = projectName ? path.join(process.cwd(), projectName) : process.cwd();
  const isNewDir = !!projectName;

  console.log(`\n🚀 Creating Core project${isNewDir ? ` in ${projectName}/` : ""}...\n`);

  // Create project directory if specified
  if (isNewDir) {
    if (await exists(targetDir)) {
      console.error(`❌ Directory "${projectName}" already exists.`);
      process.exit(1);
    }
    await mkdir(targetDir, { recursive: true });
  }

  // Create all template files
  for (const [filePath, content] of Object.entries(TEMPLATES)) {
    const fullPath = path.join(targetDir, filePath);
    const dir = path.dirname(fullPath);

    // Skip if file exists
    if (await exists(fullPath)) {
      console.log(`  ⏭️  ${filePath} (exists)`);
      continue;
    }

    // Create directory if needed
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(fullPath, content);
    console.log(`  ✅ ${filePath}`);
  }

  // Generate package.json
  const pkgPath = path.join(targetDir, "package.json");
  if (!(await exists(pkgPath))) {
    const pkg = {
      name: projectName ?? "my-core-app",
      module: "index.ts",
      type: "module",
      private: true,
      scripts: {
        dev: "bun --watch index.ts",
        start: "bun index.ts",
      },
      devDependencies: {
        "@types/bun": "latest",
      },
      peerDependencies: {
        typescript: "^5",
      },
    };
    await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`  ✅ package.json`);
  } else {
    console.log(`  ⏭️  package.json (exists)`);
  }

  console.log(`
✨ Project ready!

Next steps:
  ${isNewDir ? `cd ${projectName}\n  ` : ""}bun install
  bun run dev

Your server will be running at http://localhost:3000
`);
}

// Parse args
const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  const projectName = args[1];
  await init(projectName);
} else if (command === "--help" || command === "-h" || !command) {
  console.log(`
Core CLI

Usage:
  bunx @yourname/core init [project-name]    Create a new Core project

Options:
  --help, -h    Show this help message
`);
} else {
  console.error(`Unknown command: ${command}\nRun with --help for usage.`);
  process.exit(1);
}
