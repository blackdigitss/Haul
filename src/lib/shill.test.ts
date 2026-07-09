import { describe, expect, it } from "vitest";
import { analyzeShills, authorMatchesSeller } from "./shill";

function post(author: string, title: string, score = 50, numComments = 10, snippet = "") {
  return { author, title, score, numComments, snippet };
}

describe("authorMatchesSeller", () => {
  it("matches handle containing the seller name (case/symbol insensitive)", () => {
    expect(authorMatchesSeller("TopFashion_7", ["topfashion7"])).toBe(true);
    expect(authorMatchesSeller("topfashion-official", ["topfashion7"])).toBe(true);
  });

  it("matches long shared prefixes (sockpuppet variants)", () => {
    expect(authorMatchesSeller("kevinbagsx", ["kevinbags88"])).toBe(true);
  });

  it("ignores short/generic overlaps", () => {
    expect(authorMatchesSeller("tom", ["topfashion7"])).toBe(false);
    expect(authorMatchesSeller("randomQCguy", ["topfashion7"])).toBe(false);
  });
});

describe("analyzeShills", () => {
  it("flags authors resembling the searched seller", () => {
    const posts = [post("topfashion_cn", "My store QC — amazing quality!")];
    const result = analyzeShills(posts, ["topfashion7"]);
    expect(result.get(posts[0])?.suspicious).toBe(true);
    expect(result.get(posts[0])?.reasons[0]).toContain("self-promo");
  });

  it("flags one author flooding the result set", () => {
    const flooder = [
      post("hypeplug99", "W2C answer: check my guy"),
      post("hypeplug99", "Best seller list 2026"),
      post("hypeplug99", "QC from the best seller"),
      post("normal_user", "Actual QC thread"),
    ];
    const result = analyzeShills(flooder);
    expect(result.get(flooder[0])?.suspicious).toBe(true);
    expect(result.get(flooder[3])?.suspicious).toBe(false);
  });

  it("flags zero-engagement posts that name the seller", () => {
    const posts = [post("newacct123", "topfashion7 is the GOAT trust me", 0, 0)];
    const result = analyzeShills(posts, ["topfashion7"]);
    expect(result.get(posts[0])?.suspicious).toBe(true);
  });

  it("leaves organic high-engagement posts clean", () => {
    const posts = [post("veteranQC", "QC — hoodie from topfashion7 (40 pics)", 300, 55)];
    const result = analyzeShills(posts, ["topfashion7"]);
    expect(result.get(posts[0])?.suspicious).toBe(false);
  });
});
