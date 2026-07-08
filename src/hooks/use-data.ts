// Centralized data hooks (gatekeeps pattern): every query and mutation lives
// here, keyed by user id, demo-aware, with cache-first single-item reads.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  haulToRow,
  itemToRow,
  mapHaul,
  mapItem,
  mapRedditRef,
  mapSeller,
  mapSettings,
  sellerToRow,
} from "@/lib/mappers";
import { demoId, demoStore, isDemo } from "@/lib/demo";
import type { Haul, Item, RedditRef, Seller, UserSettings } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";

// ————— items —————

export function useItems() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["items", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Item[]> => {
      if (isDemo()) return [...demoStore().items];
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapItem);
    },
  });
}

export function useItem(id: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["item", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Item | null> => {
      const cached = qc
        .getQueryData<Item[]>(["items", user?.id])
        ?.find((i) => i.id === id);
      if (cached) return cached;
      if (isDemo()) return demoStore().items.find((i) => i.id === id) ?? null;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapItem(data) : null;
    },
  });
}

export function useAddItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<Item>): Promise<Item> => {
      if (isDemo()) {
        const full: Item = {
          id: demoId(),
          userId: user!.id,
          title: "",
          priceCNY: null,
          priceUSD: null,
          images: [],
          imageUrls: [],
          thumbUrls: [],
          mainImageIndex: 0,
          sellerId: null,
          sellerName: "",
          yupooUrl: "",
          albumId: "",
          itemUrl: "",
          sourcePlatform: "other",
          status: "saved",
          tier: "want",
          rating: 0,
          tags: [],
          category: "",
          brand: "",
          size: "",
          color: "",
          notes: "",
          haulId: null,
          batch: null,
          weight: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...item,
        };
        demoStore().items.unshift(full);
        return full;
      }
      const { data, error } = await supabase
        .from("products")
        .insert({ ...itemToRow(item), user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return mapItem(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items", user?.id] });
      qc.invalidateQueries({ queryKey: ["sellers", user?.id] });
    },
  });
}

export function useUpdateItem() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Item> & { id: string }) => {
      if (isDemo()) {
        const s = demoStore();
        const idx = s.items.findIndex((i) => i.id === id);
        if (idx >= 0) s.items[idx] = { ...s.items[idx], ...patch, updatedAt: Date.now() };
        return;
      }
      const { error } = await supabase.from("products").update(itemToRow(patch)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["items", user?.id] });
      qc.invalidateQueries({ queryKey: ["item", user?.id, id] });
    },
  });
}

export function useBulkUpdateItems() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<Item> }) => {
      if (isDemo()) {
        const s = demoStore();
        s.items = s.items.map((i) =>
          ids.includes(i.id) ? { ...i, ...patch, updatedAt: Date.now() } : i
        );
        return;
      }
      const { error } = await supabase.from("products").update(itemToRow(patch)).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items", user?.id] }),
  });
}

export function useDeleteItems() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (isDemo()) {
        const s = demoStore();
        s.items = s.items.filter((i) => !ids.includes(i.id));
        return;
      }
      const { error } = await supabase.from("products").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items", user?.id] });
      qc.invalidateQueries({ queryKey: ["hauls", user?.id] });
    },
  });
}

// ————— sellers —————

export function useSellers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sellers", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Seller[]> => {
      if (isDemo()) return [...demoStore().sellers];
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapSeller);
    },
  });
}

export function useSeller(id: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["seller", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Seller | null> => {
      const cached = qc
        .getQueryData<Seller[]>(["sellers", user?.id])
        ?.find((s) => s.id === id);
      if (cached) return cached;
      if (isDemo()) return demoStore().sellers.find((s) => s.id === id) ?? null;
      const { data, error } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapSeller(data) : null;
    },
  });
}

/** find-or-create a seller by Yupoo subdomain — the zero-friction save flow */
export function useFindOrCreateSeller() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      subdomain,
      yupooUrl,
    }: {
      name: string;
      subdomain: string;
      yupooUrl: string;
    }): Promise<Seller> => {
      if (isDemo()) {
        const s = demoStore();
        const existing = s.sellers.find((x) => x.subdomain === subdomain);
        if (existing) return existing;
        const created: Seller = {
          id: demoId(),
          userId: user!.id,
          name,
          subdomain,
          yupooUrl,
          weidianUrl: "",
          whatsapp: "",
          wechat: "",
          ratings: { quality: 0, accuracy: 0, communication: 0, shipping: 0, value: 0 },
          vetStatus: "unvetted",
          vetSummary: "",
          vetSources: [],
          vettedAt: null,
          notes: "",
          productCount: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        s.sellers.unshift(created);
        return created;
      }
      const { data: existing } = await supabase
        .from("sellers")
        .select("*")
        .eq("subdomain", subdomain)
        .maybeSingle();
      if (existing) return mapSeller(existing);
      const { data, error } = await supabase
        .from("sellers")
        .insert({ user_id: user!.id, name, subdomain, yupoo_url: yupooUrl })
        .select()
        .single();
      if (error) throw error;
      return mapSeller(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sellers", user?.id] }),
  });
}

export function useUpdateSeller() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Seller> & { id: string }) => {
      if (isDemo()) {
        const s = demoStore();
        const idx = s.sellers.findIndex((x) => x.id === id);
        if (idx >= 0) s.sellers[idx] = { ...s.sellers[idx], ...patch, updatedAt: Date.now() };
        return;
      }
      const { error } = await supabase.from("sellers").update(sellerToRow(patch)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["sellers", user?.id] });
      qc.invalidateQueries({ queryKey: ["seller", user?.id, id] });
    },
  });
}

export function useDeleteSeller() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) {
        const s = demoStore();
        s.sellers = s.sellers.filter((x) => x.id !== id);
        s.items = s.items.map((i) =>
          i.sellerId === id ? { ...i, sellerId: null } : i
        );
        return;
      }
      const { error } = await supabase.from("sellers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sellers", user?.id] });
      qc.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}

// ————— hauls —————

export function useHauls() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hauls", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Haul[]> => {
      if (isDemo()) return [...demoStore().hauls];
      const { data, error } = await supabase
        .from("hauls")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapHaul);
    },
  });
}

export function useHaul(id: string | undefined) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useQuery({
    queryKey: ["haul", user?.id, id],
    enabled: !!user && !!id,
    queryFn: async (): Promise<Haul | null> => {
      const cached = qc.getQueryData<Haul[]>(["hauls", user?.id])?.find((h) => h.id === id);
      if (cached) return cached;
      if (isDemo()) return demoStore().hauls.find((h) => h.id === id) ?? null;
      const { data, error } = await supabase
        .from("hauls")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data ? mapHaul(data) : null;
    },
  });
}

export function useAddHaul() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (haul: Partial<Haul>): Promise<Haul> => {
      if (isDemo()) {
        const full: Haul = {
          id: demoId(),
          userId: user!.id,
          name: "",
          notes: "",
          status: "planning",
          shippingCostCNY: 0,
          agentFeeCNY: 0,
          totalCNY: 0,
          totalUSD: 0,
          productIds: [],
          shippingMethod: "ems",
          trackingNumber: "",
          estimatedWeightG: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          ...haul,
        };
        demoStore().hauls.unshift(full);
        return full;
      }
      const { data, error } = await supabase
        .from("hauls")
        .insert({ ...haulToRow(haul), user_id: user!.id })
        .select()
        .single();
      if (error) throw error;
      return mapHaul(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hauls", user?.id] }),
  });
}

export function useUpdateHaul() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Haul> & { id: string }) => {
      if (isDemo()) {
        const s = demoStore();
        const idx = s.hauls.findIndex((h) => h.id === id);
        if (idx >= 0) s.hauls[idx] = { ...s.hauls[idx], ...patch, updatedAt: Date.now() };
        return;
      }
      const { error } = await supabase.from("hauls").update(haulToRow(patch)).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["hauls", user?.id] });
      qc.invalidateQueries({ queryKey: ["haul", user?.id, id] });
    },
  });
}

export function useDeleteHaul() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (haul: Haul) => {
      if (isDemo()) {
        const s = demoStore();
        s.hauls = s.hauls.filter((h) => h.id !== haul.id);
        s.items = s.items.map((i) =>
          i.haulId === haul.id ? { ...i, haulId: null, status: "saved" } : i
        );
        return;
      }
      // release member items back to "saved"
      if (haul.productIds.length > 0) {
        await supabase
          .from("products")
          .update({ haul_id: null, status: "saved" })
          .in("id", haul.productIds);
      }
      const { error } = await supabase.from("hauls").delete().eq("id", haul.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hauls", user?.id] });
      qc.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}

/** add/remove items and keep haul totals + item status in sync */
export function useSetHaulItems() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const updateHaul = useUpdateHaul();
  const bulkUpdate = useBulkUpdateItems();
  return useMutation({
    mutationFn: async ({
      haul,
      addIds = [],
      removeIds = [],
      allItems,
    }: {
      haul: Haul;
      addIds?: string[];
      removeIds?: string[];
      allItems: Item[];
    }) => {
      const nextIds = [
        ...haul.productIds.filter((id) => !removeIds.includes(id)),
        ...addIds.filter((id) => !haul.productIds.includes(id)),
      ];
      const members = allItems.filter((i) => nextIds.includes(i.id));
      const totalCNY = members.reduce((sum, i) => sum + (i.priceCNY || 0), 0);
      const totalUSD = Math.round(members.reduce((sum, i) => sum + (i.priceUSD || 0), 0) * 100) / 100;

      if (addIds.length > 0) {
        await bulkUpdate.mutateAsync({
          ids: addIds,
          patch: { haulId: haul.id, status: "planned" },
        });
      }
      if (removeIds.length > 0) {
        await bulkUpdate.mutateAsync({
          ids: removeIds,
          patch: { haulId: null, status: "saved" },
        });
      }
      await updateHaul.mutateAsync({ id: haul.id, productIds: nextIds, totalCNY, totalUSD });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hauls", user?.id] });
      qc.invalidateQueries({ queryKey: ["items", user?.id] });
    },
  });
}

// ————— reddit refs —————

export function useRedditRefs(filter?: { sellerId?: string; productId?: string }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["reddit_refs", user?.id, filter?.sellerId ?? "", filter?.productId ?? ""],
    enabled: !!user,
    queryFn: async (): Promise<RedditRef[]> => {
      if (isDemo()) {
        let refs = [...demoStore().redditRefs];
        if (filter?.sellerId) refs = refs.filter((r) => r.sellerId === filter.sellerId);
        if (filter?.productId) refs = refs.filter((r) => r.productId === filter.productId);
        return refs;
      }
      let q = supabase.from("reddit_refs").select("*").order("created_at", { ascending: false });
      if (filter?.sellerId) q = q.eq("seller_id", filter.sellerId);
      if (filter?.productId) q = q.eq("product_id", filter.productId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map(mapRedditRef);
    },
  });
}

export function useAddRedditRef() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ref: Partial<RedditRef>) => {
      if (isDemo()) {
        demoStore().redditRefs.unshift({
          id: demoId(),
          userId: user!.id,
          sellerId: null,
          productId: null,
          redditId: "",
          permalink: "",
          title: "",
          subreddit: "",
          author: "",
          score: 0,
          numComments: 0,
          snippet: "",
          postedAt: null,
          pinned: false,
          createdAt: Date.now(),
          ...ref,
        });
        return;
      }
      const { error } = await supabase.from("reddit_refs").insert({
        user_id: user!.id,
        seller_id: ref.sellerId ?? null,
        product_id: ref.productId ?? null,
        reddit_id: ref.redditId ?? "",
        permalink: ref.permalink ?? "",
        title: ref.title ?? "",
        subreddit: ref.subreddit ?? "",
        author: ref.author ?? "",
        score: ref.score ?? 0,
        num_comments: ref.numComments ?? 0,
        snippet: ref.snippet ?? "",
        posted_at: ref.postedAt ? new Date(ref.postedAt).toISOString() : null,
        pinned: ref.pinned ?? false,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reddit_refs", user?.id] }),
  });
}

export function useDeleteRedditRef() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (isDemo()) {
        const s = demoStore();
        s.redditRefs = s.redditRefs.filter((r) => r.id !== id);
        return;
      }
      const { error } = await supabase.from("reddit_refs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reddit_refs", user?.id] }),
  });
}

// ————— settings —————

export function useSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["settings", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserSettings> => {
      if (isDemo()) return demoStore().settings;
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .maybeSingle();
      if (error) throw error;
      return mapSettings(data);
    },
    placeholderData: DEFAULT_SETTINGS,
  });
}

export function useUpdateSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<UserSettings>) => {
      if (isDemo()) {
        const s = demoStore();
        s.settings = { ...s.settings, ...patch };
        return;
      }
      const row: Record<string, unknown> = {};
      if (patch.categories !== undefined) row.categories = patch.categories;
      if (patch.brands !== undefined) row.brands = patch.brands;
      if (patch.exchangeRate !== undefined) row.exchange_rate = patch.exchangeRate;
      if (patch.theme !== undefined) row.theme = patch.theme;
      if (patch.preferredAgent !== undefined) row.preferred_agent = patch.preferredAgent;
      if (patch.redditSubs !== undefined) row.reddit_subs = patch.redditSubs;

      const { data: existing } = await supabase
        .from("user_settings")
        .select("id")
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from("user_settings").update(row).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_settings")
          .insert({ ...row, user_id: user!.id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings", user?.id] }),
  });
}
