import { describe, expect, it } from "vitest";
import { buildAgentLinks, parseItemUrl } from "./agents";

describe("parseItemUrl", () => {
  it("parses weidian item URLs", () => {
    const p = parseItemUrl("https://weidian.com/item.html?itemID=7234567890");
    expect(p).toEqual({
      marketplace: "weidian",
      itemId: "7234567890",
      url: "https://weidian.com/item.html?itemID=7234567890",
    });
  });

  it("parses weidian itemId casing variants and shop subdomains", () => {
    expect(parseItemUrl("https://shop123.v.weidian.com/item.html?itemId=555")?.itemId).toBe("555");
    expect(parseItemUrl("https://weidian.com/item.html?item_id=777&spider_token=x")?.itemId).toBe("777");
  });

  it("parses taobao and tmall URLs", () => {
    expect(parseItemUrl("https://item.taobao.com/item.htm?id=675330231400")?.marketplace).toBe("taobao");
    expect(parseItemUrl("https://detail.tmall.com/item.htm?id=123456")?.itemId).toBe("123456");
  });

  it("parses 1688 offer URLs", () => {
    const p = parseItemUrl("https://detail.1688.com/offer/601234567890.html");
    expect(p?.marketplace).toBe("1688");
    expect(p?.itemId).toBe("601234567890");
  });

  it("rejects garbage", () => {
    expect(parseItemUrl("")).toBeNull();
    expect(parseItemUrl("not a url")).toBeNull();
    expect(parseItemUrl("https://example.com/item?id=1")).toBeNull();
    expect(parseItemUrl("https://weidian.com/?userid=123")).toBeNull();
  });
});

describe("buildAgentLinks", () => {
  it("builds links for every agent from a weidian URL", () => {
    const links = buildAgentLinks("https://weidian.com/item.html?itemID=7234567890");
    expect(links.length).toBeGreaterThanOrEqual(5);
    const byId = Object.fromEntries(links.map((l) => [l.id, l.url]));
    expect(byId.allchinabuy).toContain(encodeURIComponent("https://weidian.com/item.html?itemID=7234567890"));
    expect(byId.cnfans).toBe("https://cnfans.com/product/?shop_type=weidian&id=7234567890");
    expect(byId.hoobuy).toBe("https://hoobuy.com/product/2/7234567890");
  });

  it("uses taobao shop_type for taobao links", () => {
    const links = buildAgentLinks("https://item.taobao.com/item.htm?id=99");
    const cnfans = links.find((l) => l.id === "cnfans");
    expect(cnfans?.url).toContain("shop_type=taobao&id=99");
  });

  it("returns empty for unparseable URLs", () => {
    expect(buildAgentLinks("https://google.com")).toEqual([]);
  });
});
