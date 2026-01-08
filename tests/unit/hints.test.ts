import { describe, test, expect } from "bun:test";
import { 
  HintCollector, 
  buildLinkHeader, 
  buildLinkTags, 
  configToHints,
  type ResourceHint,
  type HintsConfig,
} from "@yoeast/core";

describe("Resource Hints", () => {
  describe("HintCollector", () => {
    test("collects preload hints", () => {
      const collector = new HintCollector();
      collector.preload("/css/app.css", "style");
      collector.preload("/fonts/inter.woff2", "font", { crossorigin: true });
      
      const hints = collector.getHints();
      expect(hints).toHaveLength(2);
      expect(hints[0]).toEqual({
        href: "/css/app.css",
        type: "preload",
        as: "style",
      });
      expect(hints[1]).toEqual({
        href: "/fonts/inter.woff2",
        type: "preload",
        as: "font",
        crossorigin: true,
      });
    });

    test("collects preconnect hints", () => {
      const collector = new HintCollector();
      collector.preconnect("https://api.example.com");
      collector.preconnect("https://cdn.example.com", true);
      
      const hints = collector.getHints();
      expect(hints).toHaveLength(2);
      expect(hints[0]).toEqual({
        href: "https://api.example.com",
        type: "preconnect",
        crossorigin: undefined,
      });
      expect(hints[1]).toEqual({
        href: "https://cdn.example.com",
        type: "preconnect",
        crossorigin: true,
      });
    });

    test("collects prefetch hints", () => {
      const collector = new HintCollector();
      collector.prefetch("/api/users");
      collector.prefetch("/next-page.js", "script");
      
      const hints = collector.getHints();
      expect(hints).toHaveLength(2);
      expect(hints[0]!.type).toBe("prefetch");
      expect(hints[1]!.as).toBe("script");
    });

    test("collects dns-prefetch hints", () => {
      const collector = new HintCollector();
      collector.dnsPrefetch("https://analytics.example.com");
      
      const hints = collector.getHints();
      expect(hints).toHaveLength(1);
      expect(hints[0]!.type).toBe("dns-prefetch");
    });

    test("hasHints returns correct value", () => {
      const collector = new HintCollector();
      expect(collector.hasHints()).toBe(false);
      
      collector.preload("/css/app.css", "style");
      expect(collector.hasHints()).toBe(true);
    });

    test("clear removes all hints", () => {
      const collector = new HintCollector();
      collector.preload("/css/app.css", "style");
      collector.preconnect("https://api.example.com");
      
      expect(collector.hasHints()).toBe(true);
      collector.clear();
      expect(collector.hasHints()).toBe(false);
    });

    test("addHint adds raw hint", () => {
      const collector = new HintCollector();
      collector.addHint({
        href: "/custom",
        type: "preload",
        as: "fetch",
        fetchpriority: "high",
      });
      
      const hints = collector.getHints();
      expect(hints[0]!.fetchpriority).toBe("high");
    });
  });

  describe("buildLinkHeader", () => {
    test("builds simple preload header", () => {
      const hints: ResourceHint[] = [
        { href: "/css/app.css", type: "preload", as: "style" },
      ];
      
      const header = buildLinkHeader(hints);
      expect(header).toBe("</css/app.css>; rel=preload; as=style");
    });

    test("builds header with crossorigin", () => {
      const hints: ResourceHint[] = [
        { href: "/fonts/inter.woff2", type: "preload", as: "font", crossorigin: true },
      ];
      
      const header = buildLinkHeader(hints);
      expect(header).toBe("</fonts/inter.woff2>; rel=preload; as=font; crossorigin");
    });

    test("builds multiple hints", () => {
      const hints: ResourceHint[] = [
        { href: "/css/app.css", type: "preload", as: "style" },
        { href: "https://api.example.com", type: "preconnect" },
      ];
      
      const header = buildLinkHeader(hints);
      expect(header).toContain("</css/app.css>; rel=preload; as=style");
      expect(header).toContain("<https://api.example.com>; rel=preconnect");
    });
  });

  describe("buildLinkTags", () => {
    test("builds simple preload tag", () => {
      const hints: ResourceHint[] = [
        { href: "/css/app.css", type: "preload", as: "style" },
      ];
      
      const tags = buildLinkTags(hints);
      expect(tags).toBe('<link rel="preload" href="/css/app.css" as="style">');
    });

    test("builds tag with all attributes", () => {
      const hints: ResourceHint[] = [
        { 
          href: "/fonts/inter.woff2", 
          type: "preload", 
          as: "font", 
          crossorigin: true,
          mimeType: "font/woff2",
          fetchpriority: "high",
        },
      ];
      
      const tags = buildLinkTags(hints);
      expect(tags).toContain('rel="preload"');
      expect(tags).toContain('href="/fonts/inter.woff2"');
      expect(tags).toContain('as="font"');
      expect(tags).toContain('crossorigin');
      expect(tags).toContain('type="font/woff2"');
      expect(tags).toContain('fetchpriority="high"');
    });

    test("builds preconnect tag", () => {
      const hints: ResourceHint[] = [
        { href: "https://api.example.com", type: "preconnect" },
      ];
      
      const tags = buildLinkTags(hints);
      expect(tags).toBe('<link rel="preconnect" href="https://api.example.com">');
    });

    test("escapes HTML in href", () => {
      const hints: ResourceHint[] = [
        { href: '/path?a=1&b=2', type: "prefetch" },
      ];
      
      const tags = buildLinkTags(hints);
      expect(tags).toContain('href="/path?a=1&amp;b=2"');
    });
  });

  describe("configToHints", () => {
    test("converts preload config", () => {
      const config: HintsConfig = {
        preload: [
          { href: "/css/app.css", as: "style" },
          { href: "/js/app.js", as: "script" },
        ],
      };
      
      const hints = configToHints(config);
      expect(hints).toHaveLength(2);
      expect(hints[0]!.type).toBe("preload");
      expect(hints[1]!.type).toBe("preload");
    });

    test("converts preconnect config", () => {
      const config: HintsConfig = {
        preconnect: [
          { href: "https://api.example.com" },
          { href: "https://cdn.example.com", crossorigin: true },
        ],
      };
      
      const hints = configToHints(config);
      expect(hints).toHaveLength(2);
      expect(hints[0]!.type).toBe("preconnect");
      expect(hints[1]!.crossorigin).toBe(true);
    });

    test("converts mixed config", () => {
      const config: HintsConfig = {
        preload: [{ href: "/css/app.css", as: "style" }],
        preconnect: [{ href: "https://api.example.com" }],
        prefetch: [{ href: "/next-page" }],
        dnsPrefetch: [{ href: "https://analytics.example.com" }],
      };
      
      const hints = configToHints(config);
      expect(hints).toHaveLength(4);
      expect(hints.map(h => h.type)).toEqual(["preload", "preconnect", "prefetch", "dns-prefetch"]);
    });

    test("handles empty config", () => {
      const config: HintsConfig = {};
      const hints = configToHints(config);
      expect(hints).toHaveLength(0);
    });
  });
});
