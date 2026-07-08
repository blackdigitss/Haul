import { describe, expect, it } from "vitest";
import { detectBatch, extractYupooSubdomain, parsePriceCNY } from "./parse";

describe("parsePriceCNY", () => {
  it("parses ¥ prices with high confidence", () => {
    expect(parsePriceCNY("现货 ¥268 heavy fleece")).toEqual({ value: 268, confidence: "high" });
  });

  it("parses RMB text forms", () => {
    expect(parsePriceCNY("price: 499 rmb shipped").value).toBe(499);
    expect(parsePriceCNY("CNY: 328").value).toBe(328);
    expect(parsePriceCNY("580元包邮").value).toBe(580);
  });

  it("picks the weighted winner when multiple numbers appear", () => {
    // ¥ pattern (weight 3) should beat the bare $ pattern (weight 1)
    expect(parsePriceCNY("was $60, now ¥328").value).toBe(328);
  });

  it("ignores out-of-range values", () => {
    expect(parsePriceCNY("¥5").value).toBeNull();
    expect(parsePriceCNY("").value).toBeNull();
  });
});

describe("detectBatch", () => {
  it("detects batch codes", () => {
    expect(detectBatch("Jordan 4 LJR batch top version")).toBe("LJR");
    expect(detectBatch("pk god version ¥499")).toBe("PK GOD");
  });

  it("prefers longer codes over substrings", () => {
    expect(detectBatch("PK GOD batch")).toBe("PK GOD");
  });

  it("returns null when nothing matches", () => {
    expect(detectBatch("plain hoodie")).toBeNull();
  });
});

describe("extractYupooSubdomain", () => {
  it("extracts from x.yupoo.com URLs", () => {
    expect(extractYupooSubdomain("https://topfashion7.x.yupoo.com/albums/123")).toBe("topfashion7");
    expect(extractYupooSubdomain("https://husky.yupoo.com/albums")).toBe("husky");
  });

  it("returns null for non-yupoo", () => {
    expect(extractYupooSubdomain("https://weidian.com/item.html?itemID=1")).toBeNull();
  });
});
