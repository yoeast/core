/**
 * Tests for Handlebars helper plugins.
 * Tests helpers by registering them and calling via Handlebars templates.
 */
import { describe, test, expect, beforeAll } from "bun:test";
import Handlebars from "handlebars";

// Import all helper plugins
import { register as registerString } from "@core/views/plugins/string";
import { register as registerMath } from "@core/views/plugins/math";
import { register as registerComparison } from "@core/views/plugins/comparison";
import { register as registerArray } from "@core/views/plugins/array";
import { register as registerUtil } from "@core/views/plugins/util";
import { register as registerNumber } from "@core/views/plugins/number";
import { register as registerDate } from "@core/views/plugins/date";
import { register as registerControl } from "@core/views/plugins/control";
import { register as registerJson } from "@core/views/plugins/json";
import { register as registerDebug } from "@core/views/plugins/debug";

let hbs: typeof Handlebars;

beforeAll(() => {
  hbs = Handlebars.create();
  registerString(hbs);
  registerMath(hbs);
  registerComparison(hbs);
  registerArray(hbs);
  registerUtil(hbs);
  registerNumber(hbs);
  registerDate(hbs);
  registerControl(hbs);
  registerJson(hbs);
  registerDebug(hbs);
});

function render(template: string, context: Record<string, unknown> = {}): string {
  return hbs.compile(template)(context);
}

describe("string helpers", () => {
  test("truncate shortens strings", () => {
    expect(render("{{truncate text 10}}", { text: "Hello World!" })).toBe("Hello Worl...");
    expect(render("{{truncate text 100}}", { text: "Short" })).toBe("Short");
  });

  test("uppercase converts to upper case", () => {
    expect(render("{{uppercase text}}", { text: "hello" })).toBe("HELLO");
  });

  test("lowercase converts to lower case", () => {
    expect(render("{{lowercase text}}", { text: "HELLO" })).toBe("hello");
  });

  test("capitalize capitalizes first letter", () => {
    expect(render("{{capitalize text}}", { text: "hello world" })).toBe("Hello world");
  });

  test("titleCase converts to title case", () => {
    expect(render("{{titleCase text}}", { text: "hello world" })).toBe("Hello World");
  });

  test("urlencode encodes URL components", () => {
    expect(render("{{urlencode text}}", { text: "hello world" })).toBe("hello%20world");
    expect(render("{{urlencode text}}", { text: "a=b&c=d" })).toBe("a%3Db%26c%3Dd");
  });

  test("trim removes whitespace", () => {
    expect(render("{{trim text}}", { text: "  hello  " })).toBe("hello");
  });

  test("replace replaces substrings", () => {
    expect(render('{{replace text "o" "0"}}', { text: "hello" })).toBe("hell0");
    expect(render('{{replace text "l" "L"}}', { text: "hello" })).toBe("heLLo");
  });

  test("pluralize returns correct form", () => {
    expect(render('{{pluralize count "item"}}', { count: 1 })).toBe("item");
    expect(render('{{pluralize count "item"}}', { count: 2 })).toBe("items");
    expect(render('{{pluralize count "child" "children"}}', { count: 2 })).toBe("children");
  });

  test("slugify creates URL slugs", () => {
    expect(render("{{slugify text}}", { text: "Hello World!" })).toBe("hello-world");
    expect(render("{{slugify text}}", { text: "My  Cool  Post" })).toBe("my-cool-post");
  });
});

describe("math helpers", () => {
  test("add sums numbers", () => {
    expect(render("{{add a b}}", { a: 2, b: 3 })).toBe("5");
  });

  test("subtract subtracts numbers", () => {
    expect(render("{{subtract a b}}", { a: 5, b: 3 })).toBe("2");
  });

  test("multiply multiplies numbers", () => {
    expect(render("{{multiply a b}}", { a: 4, b: 3 })).toBe("12");
  });

  test("divide divides numbers", () => {
    expect(render("{{divide a b}}", { a: 12, b: 3 })).toBe("4");
    expect(render("{{divide a b}}", { a: 5, b: 0 })).toBe("0"); // Division by zero
  });

  test("mod calculates modulo", () => {
    expect(render("{{mod a b}}", { a: 7, b: 3 })).toBe("1");
  });

  test("ceil rounds up", () => {
    expect(render("{{ceil n}}", { n: 4.2 })).toBe("5");
  });

  test("floor rounds down", () => {
    expect(render("{{floor n}}", { n: 4.8 })).toBe("4");
  });

  test("round rounds to nearest", () => {
    expect(render("{{round n}}", { n: 4.5 })).toBe("5");
    expect(render("{{round n}}", { n: 4.4 })).toBe("4");
  });

  test("abs returns absolute value", () => {
    expect(render("{{abs n}}", { n: -5 })).toBe("5");
  });

  test("min returns minimum", () => {
    expect(render("{{min a b c}}", { a: 5, b: 2, c: 8 })).toBe("2");
  });

  test("max returns maximum", () => {
    expect(render("{{max a b c}}", { a: 5, b: 2, c: 8 })).toBe("8");
  });

  test("pow calculates power", () => {
    expect(render("{{pow a b}}", { a: 2, b: 3 })).toBe("8");
  });

  test("sqrt calculates square root", () => {
    expect(render("{{sqrt n}}", { n: 9 })).toBe("3");
  });

  test("clamp constrains value", () => {
    expect(render("{{clamp n min max}}", { n: 5, min: 0, max: 10 })).toBe("5");
    expect(render("{{clamp n min max}}", { n: -5, min: 0, max: 10 })).toBe("0");
    expect(render("{{clamp n min max}}", { n: 15, min: 0, max: 10 })).toBe("10");
  });
});

describe("comparison helpers", () => {
  test("eq checks equality", () => {
    expect(render("{{#if (eq a b)}}yes{{else}}no{{/if}}", { a: 1, b: 1 })).toBe("yes");
    expect(render("{{#if (eq a b)}}yes{{else}}no{{/if}}", { a: 1, b: 2 })).toBe("no");
  });

  test("ne checks inequality", () => {
    expect(render("{{#if (ne a b)}}yes{{else}}no{{/if}}", { a: 1, b: 2 })).toBe("yes");
    expect(render("{{#if (ne a b)}}yes{{else}}no{{/if}}", { a: 1, b: 1 })).toBe("no");
  });

  test("gt checks greater than", () => {
    expect(render("{{#if (gt a b)}}yes{{else}}no{{/if}}", { a: 5, b: 3 })).toBe("yes");
    expect(render("{{#if (gt a b)}}yes{{else}}no{{/if}}", { a: 3, b: 5 })).toBe("no");
  });

  test("gte checks greater or equal", () => {
    expect(render("{{#if (gte a b)}}yes{{else}}no{{/if}}", { a: 5, b: 5 })).toBe("yes");
    expect(render("{{#if (gte a b)}}yes{{else}}no{{/if}}", { a: 4, b: 5 })).toBe("no");
  });

  test("lt checks less than", () => {
    expect(render("{{#if (lt a b)}}yes{{else}}no{{/if}}", { a: 3, b: 5 })).toBe("yes");
    expect(render("{{#if (lt a b)}}yes{{else}}no{{/if}}", { a: 5, b: 3 })).toBe("no");
  });

  test("lte checks less or equal", () => {
    expect(render("{{#if (lte a b)}}yes{{else}}no{{/if}}", { a: 5, b: 5 })).toBe("yes");
    expect(render("{{#if (lte a b)}}yes{{else}}no{{/if}}", { a: 6, b: 5 })).toBe("no");
  });

  test("and checks all truthy", () => {
    expect(render("{{#if (and a b)}}yes{{else}}no{{/if}}", { a: true, b: true })).toBe("yes");
    expect(render("{{#if (and a b)}}yes{{else}}no{{/if}}", { a: true, b: false })).toBe("no");
  });

  test("or checks any truthy", () => {
    expect(render("{{#if (or a b)}}yes{{else}}no{{/if}}", { a: false, b: true })).toBe("yes");
    expect(render("{{#if (or a b)}}yes{{else}}no{{/if}}", { a: false, b: false })).toBe("no");
  });

  test("not negates value", () => {
    expect(render("{{#if (not a)}}yes{{else}}no{{/if}}", { a: false })).toBe("yes");
    expect(render("{{#if (not a)}}yes{{else}}no{{/if}}", { a: true })).toBe("no");
  });

  test("ifEquals block helper", () => {
    expect(render("{{#ifEquals a b}}yes{{else}}no{{/ifEquals}}", { a: "x", b: "x" })).toBe("yes");
    expect(render("{{#ifEquals a b}}yes{{else}}no{{/ifEquals}}", { a: "x", b: "y" })).toBe("no");
  });

  test("ifGt block helper", () => {
    expect(render("{{#ifGt a b}}yes{{else}}no{{/ifGt}}", { a: 5, b: 3 })).toBe("yes");
    expect(render("{{#ifGt a b}}yes{{else}}no{{/ifGt}}", { a: 3, b: 5 })).toBe("no");
  });

  test("ifLt block helper", () => {
    expect(render("{{#ifLt a b}}yes{{else}}no{{/ifLt}}", { a: 3, b: 5 })).toBe("yes");
    expect(render("{{#ifLt a b}}yes{{else}}no{{/ifLt}}", { a: 5, b: 3 })).toBe("no");
  });

  test("ifNot block helper", () => {
    expect(render("{{#ifNot a}}yes{{else}}no{{/ifNot}}", { a: false })).toBe("yes");
    expect(render("{{#ifNot a}}yes{{else}}no{{/ifNot}}", { a: true })).toBe("no");
  });
});

describe("array helpers", () => {
  test("length returns array length", () => {
    expect(render("{{length arr}}", { arr: [1, 2, 3] })).toBe("3");
    expect(render("{{length arr}}", { arr: [] })).toBe("0");
    expect(render("{{length arr}}", { arr: null })).toBe("0");
  });

  test("first returns first element", () => {
    expect(render("{{first arr}}", { arr: ["a", "b", "c"] })).toBe("a");
  });

  test("last returns last element", () => {
    expect(render("{{last arr}}", { arr: ["a", "b", "c"] })).toBe("c");
  });

  test("nth returns element at index", () => {
    expect(render("{{nth arr 1}}", { arr: ["a", "b", "c"] })).toBe("b");
  });

  test("join joins array elements", () => {
    expect(render("{{join arr}}", { arr: ["a", "b", "c"] })).toBe("a, b, c");
    expect(render('{{join arr "-"}}', { arr: ["a", "b", "c"] })).toBe("a-b-c");
  });

  test("includes checks array membership", () => {
    expect(render("{{#if (includes arr val)}}yes{{else}}no{{/if}}", { arr: [1, 2, 3], val: 2 })).toBe("yes");
    expect(render("{{#if (includes arr val)}}yes{{else}}no{{/if}}", { arr: [1, 2, 3], val: 5 })).toBe("no");
  });

  test("range generates number sequence", () => {
    expect(render("{{#each (range 1 3)}}{{this}}{{/each}}", {})).toBe("123");
  });

  test("slice returns array portion", () => {
    expect(render("{{#each (slice arr 1 3)}}{{this}}{{/each}}", { arr: ["a", "b", "c", "d"] })).toBe("bc");
    expect(render("{{#each (slice arr 2)}}{{this}}{{/each}}", { arr: ["a", "b", "c", "d"] })).toBe("cd");
  });

  test("take returns first n elements", () => {
    expect(render("{{#each (take arr 2)}}{{this}}{{/each}}", { arr: ["a", "b", "c"] })).toBe("ab");
  });

  test("skip returns elements after n", () => {
    expect(render("{{#each (skip arr 1)}}{{this}}{{/each}}", { arr: ["a", "b", "c"] })).toBe("bc");
  });

  test("reverse reverses array", () => {
    expect(render("{{#each (reverse arr)}}{{this}}{{/each}}", { arr: ["a", "b", "c"] })).toBe("cba");
  });

  test("sort sorts array", () => {
    expect(render("{{#each (sort arr)}}{{this}}{{/each}}", { arr: ["c", "a", "b"] })).toBe("abc");
  });

  test("sort by key sorts objects", () => {
    const items = [{ name: "Charlie" }, { name: "Alice" }, { name: "Bob" }];
    expect(render('{{#each (sort arr "name")}}{{name}}{{/each}}', { arr: items })).toBe("AliceBobCharlie");
  });
});

describe("utility helpers", () => {
  test("concat joins values", () => {
    expect(render("{{concat a b c}}", { a: "Hello", b: " ", c: "World" })).toBe("Hello World");
  });

  test("default provides fallback", () => {
    expect(render("{{default val fallback}}", { val: null, fallback: "default" })).toBe("default");
    expect(render("{{default val fallback}}", { val: "actual", fallback: "default" })).toBe("actual");
  });

  test("coalesce returns first truthy", () => {
    expect(render("{{coalesce a b c}}", { a: null, b: "", c: "value" })).toBe("value");
    expect(render("{{coalesce a b c}}", { a: "first", b: "second", c: "third" })).toBe("first");
  });

  test("isDefined checks for null/undefined", () => {
    expect(render("{{#if (isDefined val)}}yes{{else}}no{{/if}}", { val: 0 })).toBe("yes");
    expect(render("{{#if (isDefined val)}}yes{{else}}no{{/if}}", { val: null })).toBe("no");
  });

  test("isEmpty checks for empty values", () => {
    expect(render("{{#if (isEmpty val)}}yes{{else}}no{{/if}}", { val: "" })).toBe("yes");
    expect(render("{{#if (isEmpty val)}}yes{{else}}no{{/if}}", { val: [] })).toBe("yes");
    expect(render("{{#if (isEmpty val)}}yes{{else}}no{{/if}}", { val: {} })).toBe("yes");
    expect(render("{{#if (isEmpty val)}}yes{{else}}no{{/if}}", { val: null })).toBe("yes");
    expect(render("{{#if (isEmpty val)}}yes{{else}}no{{/if}}", { val: "hello" })).toBe("no");
  });

  test("type checking helpers", () => {
    expect(render("{{#if (isArray val)}}yes{{else}}no{{/if}}", { val: [1, 2] })).toBe("yes");
    expect(render("{{#if (isObject val)}}yes{{else}}no{{/if}}", { val: { a: 1 } })).toBe("yes");
    expect(render("{{#if (isString val)}}yes{{else}}no{{/if}}", { val: "hello" })).toBe("yes");
    expect(render("{{#if (isNumber val)}}yes{{else}}no{{/if}}", { val: 42 })).toBe("yes");
    expect(render("{{#if (isBoolean val)}}yes{{else}}no{{/if}}", { val: true })).toBe("yes");
  });

  test("keys returns object keys", () => {
    expect(render("{{#each (keys obj)}}{{this}}{{/each}}", { obj: { a: 1, b: 2 } })).toBe("ab");
  });

  test("values returns object values", () => {
    expect(render("{{#each (values obj)}}{{this}}{{/each}}", { obj: { a: 1, b: 2 } })).toBe("12");
  });

  test("get accesses nested properties", () => {
    const obj = { user: { profile: { name: "John" } } };
    expect(render('{{get obj "user.profile.name"}}', { obj })).toBe("John");
    expect(render('{{get obj "user.missing.path"}}', { obj })).toBe("");
  });
});

describe("number helpers", () => {
  test("formatNumber formats with locale", () => {
    expect(render("{{formatNumber n}}", { n: 1234567 })).toBe("1,234,567");
  });

  test("formatCurrency formats as currency", () => {
    const result = render("{{formatCurrency n}}", { n: 1234.5 });
    expect(result).toContain("1,234.50");
  });

  test("formatBytes formats byte sizes", () => {
    expect(render("{{formatBytes n}}", { n: 1024 })).toBe("1 KB");
    expect(render("{{formatBytes n}}", { n: 1048576 })).toBe("1 MB");
  });

  test("formatPercent formats percentages", () => {
    expect(render("{{formatPercent n}}", { n: 0.5 })).toBe("50.0%");
    expect(render("{{formatPercent n 0}}", { n: 0.5 })).toBe("50%");
  });
});

describe("date helpers", () => {
  test("now returns current ISO timestamp", () => {
    const result = render("{{now}}", {});
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });

  test("formatDate formats dates", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    const result = render("{{formatDate d}}", { d: date });
    expect(result).toContain("2024");
  });

  test("timeAgo returns relative time", () => {
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const result = render("{{timeAgo d}}", { d: oneMinuteAgo });
    expect(result).toContain("minute");
  });

  test("year returns current year", () => {
    const result = render("{{year}}", {});
    expect(result).toBe(String(new Date().getFullYear()));
  });
});

describe("control helpers", () => {
  test("switch/case selects matching case", () => {
    const template = `{{#switch color}}{{#case "red"}}RED{{/case}}{{#case "blue"}}BLUE{{/case}}{{/switch}}`;
    expect(render(template, { color: "red" })).toBe("RED");
    expect(render(template, { color: "blue" })).toBe("BLUE");
  });

  test("defaultCase provides fallback", () => {
    const template = `{{#switch color}}{{#case "red"}}RED{{/case}}{{#defaultCase}}OTHER{{/defaultCase}}{{/switch}}`;
    expect(render(template, { color: "green" })).toBe("OTHER");
  });

  test("times repeats n times", () => {
    expect(render("{{#times 3}}x{{/times}}", {})).toBe("xxx");
  });

  test("times provides index", () => {
    expect(render("{{#times 3}}{{index}}{{/times}}", {})).toBe("012");
  });

  test("times provides first/last", () => {
    expect(render("{{#times 3}}{{#if first}}F{{/if}}{{#if last}}L{{/if}}{{/times}}", {})).toBe("FL");
  });

  test("repeat iterates array with separator", () => {
    const items = [{ name: "a" }, { name: "b" }, { name: "c" }];
    expect(render('{{#repeat arr ", "}}{{name}}{{/repeat}}', { arr: items })).toBe("a, b, c");
  });

  test("repeat without separator", () => {
    const items = [{ name: "a" }, { name: "b" }];
    expect(render("{{#repeat arr}}{{name}}{{/repeat}}", { arr: items })).toBe("ab");
  });
});

describe("json helpers", () => {
  test("json outputs pretty JSON", () => {
    const obj = { a: 1, b: 2 };
    const result = render("{{json obj}}", { obj });
    // Handlebars escapes quotes in output
    expect(result).toContain("&quot;a&quot;");
    expect(result).toContain("\n");
  });

  test("jsonInline outputs compact JSON", () => {
    const obj = { a: 1, b: 2 };
    const result = render("{{jsonInline obj}}", { obj });
    // Handlebars escapes quotes
    expect(result).toBe('{&quot;a&quot;:1,&quot;b&quot;:2}');
  });
});

describe("debug helpers", () => {
  test("debug outputs HTML pre block", () => {
    const obj = { test: 123 };
    const result = render("{{debug obj}}", { obj });
    expect(result).toContain("<pre");
    expect(result).toContain("test");
    expect(result).toContain("123");
  });

  test("debugContext outputs current context", () => {
    const result = render("{{debugContext}}", { foo: "bar" });
    expect(result).toContain("<pre");
    expect(result).toContain("foo");
    expect(result).toContain("bar");
  });
});
