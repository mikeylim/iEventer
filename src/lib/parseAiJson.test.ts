import { describe, it, expect } from "vitest";
import { parseAiJson } from "./parseAiJson";

describe("parseAiJson", () => {
  it("parses clean JSON", () => {
    expect(parseAiJson('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json code fences", () => {
    const wrapped = '```json\n{"a":1}\n```';
    expect(parseAiJson(wrapped)).toEqual({ a: 1 });
  });

  it("strips plain ``` fences", () => {
    expect(parseAiJson("```\n{\"a\":1}\n```")).toEqual({ a: 1 });
  });

  it("recovers from trailing commas before } and ]", () => {
    const sloppy = '{"items":[1,2,3,],"name":"x",}';
    expect(parseAiJson(sloppy)).toEqual({ items: [1, 2, 3], name: "x" });
  });

  it("ignores preamble and trailing chatter around a JSON object", () => {
    const noisy = 'Sure! Here is your data:\n{"a":1}\nLet me know if you want more.';
    expect(parseAiJson(noisy)).toEqual({ a: 1 });
  });

  it("parses JSON arrays at the top level", () => {
    expect(parseAiJson("[1, 2, 3]")).toEqual([1, 2, 3]);
  });

  it("throws on truly invalid JSON, attaching raw output to the message", () => {
    const broken = '{"a": "missing quote}';
    expect(() => parseAiJson(broken)).toThrow(/Raw AI output/);
  });
});
