// Shopping-agent link builder. You never buy on Yupoo/Weidian directly —
// you paste the item link into an agent (AllChinaBuy, CNFans, …). This module
// turns any Weidian/Taobao/1688 item URL into one-tap agent purchase links.

export type Marketplace = "weidian" | "taobao" | "1688";

export interface ParsedItemUrl {
  marketplace: Marketplace;
  itemId: string;
  /** canonical form of the original URL */
  url: string;
}

export interface AgentDef {
  id: string;
  label: string;
  build: (parsed: ParsedItemUrl) => string;
}

/** Extracts marketplace + item id from a raw product URL, if recognizable. */
export function parseItemUrl(raw: string): ParsedItemUrl | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();

  if (host.endsWith("weidian.com")) {
    const id =
      url.searchParams.get("itemID") ||
      url.searchParams.get("itemId") ||
      url.searchParams.get("item_id") ||
      url.pathname.match(/\/item\/(\d+)/)?.[1];
    if (id && /^\d+$/.test(id)) {
      return {
        marketplace: "weidian",
        itemId: id,
        url: `https://weidian.com/item.html?itemID=${id}`,
      };
    }
    return null;
  }

  if (host.endsWith("taobao.com") || host.endsWith("tmall.com")) {
    const id = url.searchParams.get("id");
    if (id && /^\d+$/.test(id)) {
      return {
        marketplace: "taobao",
        itemId: id,
        url: `https://item.taobao.com/item.htm?id=${id}`,
      };
    }
    return null;
  }

  if (host.endsWith("1688.com")) {
    const id = url.pathname.match(/\/offer\/(\d+)\.html/)?.[1];
    if (id) {
      return {
        marketplace: "1688",
        itemId: id,
        url: `https://detail.1688.com/offer/${id}.html`,
      };
    }
    return null;
  }

  return null;
}

const SHOP_TYPE: Record<Marketplace, string> = {
  weidian: "weidian",
  taobao: "taobao",
  "1688": "ali_1688",
};

const HOOBUY_CODE: Record<Marketplace, string> = {
  taobao: "1",
  weidian: "2",
  "1688": "0",
};

export const AGENTS: AgentDef[] = [
  {
    id: "allchinabuy",
    label: "AllChinaBuy",
    build: (p) =>
      `https://www.allchinabuy.com/en/page/buy/?from=search-input&url=${encodeURIComponent(p.url)}`,
  },
  {
    id: "cnfans",
    label: "CNFans",
    build: (p) => `https://cnfans.com/product/?shop_type=${SHOP_TYPE[p.marketplace]}&id=${p.itemId}`,
  },
  {
    id: "mulebuy",
    label: "Mulebuy",
    build: (p) => `https://mulebuy.com/product/?shop_type=${SHOP_TYPE[p.marketplace]}&id=${p.itemId}`,
  },
  {
    id: "superbuy",
    label: "Superbuy",
    build: (p) =>
      `https://www.superbuy.com/en/page/buy/?from=search-input&url=${encodeURIComponent(p.url)}`,
  },
  {
    id: "sugargoo",
    label: "Sugargoo",
    build: (p) =>
      `https://www.sugargoo.com/#/home/productDetail?productLink=${encodeURIComponent(p.url)}`,
  },
  {
    id: "hoobuy",
    label: "Hoobuy",
    build: (p) => `https://hoobuy.com/product/${HOOBUY_CODE[p.marketplace]}/${p.itemId}`,
  },
];

export interface AgentLink {
  id: string;
  label: string;
  url: string;
}

/** All agent purchase links for a raw item URL (empty if unparseable). */
export function buildAgentLinks(rawUrl: string): AgentLink[] {
  const parsed = parseItemUrl(rawUrl);
  if (!parsed) return [];
  return AGENTS.map((a) => ({ id: a.id, label: a.label, url: a.build(parsed) }));
}
