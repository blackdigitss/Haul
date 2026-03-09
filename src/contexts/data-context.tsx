"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import Fuse from "fuse.js";
import { useAuth } from "./auth-context";
import {
  subscribeProducts,
  subscribeSellers,
  subscribeHauls,
  getSettings,
  createProduct as fbCreateProduct,
  updateProduct as fbUpdateProduct,
  deleteProduct as fbDeleteProduct,
  batchUpdateProducts as fbBatchUpdateProducts,
  createSeller as fbCreateSeller,
  updateSeller as fbUpdateSeller,
  deleteSeller as fbDeleteSeller,
  createHaul as fbCreateHaul,
  updateHaul as fbUpdateHaul,
  deleteHaul as fbDeleteHaul,
  updateSettings as fbUpdateSettings,
} from "@/lib/firestore";
import type {
  Product,
  Seller,
  Haul,
  UserSettings,
  ProductFilters,
} from "@/types";
import { DEFAULT_FILTERS, TIER_CONFIG } from "@/types";

interface DataContextType {
  // Data
  products: Product[];
  sellers: Seller[];
  hauls: Haul[];
  settings: UserSettings | null;
  loading: boolean;

  // Product operations
  createProduct: (data: Omit<Product, "id" | "created_at" | "updated_at">) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  batchUpdateProducts: (updates: { id: string; data: Partial<Product> }[]) => Promise<void>;

  // Seller operations
  createSeller: (data: Omit<Seller, "id" | "created_at" | "updated_at">) => Promise<Seller>;
  updateSeller: (id: string, data: Partial<Seller>) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  getSellerByUrl: (yupooUrl: string) => Seller | undefined;

  // Haul operations
  createHaul: (data: Omit<Haul, "id" | "created_at" | "updated_at">) => Promise<Haul>;
  updateHaul: (id: string, data: Partial<Haul>) => Promise<void>;
  deleteHaul: (id: string) => Promise<void>;

  // Settings
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;

  // Search & Filter
  filters: ProductFilters;
  setFilters: (filters: Partial<ProductFilters>) => void;
  resetFilters: () => void;
  filteredProducts: Product[];
  searchProducts: (query: string) => Product[];
}

const DataContext = createContext<DataContextType | null>(null);

const FUSE_OPTIONS = {
  keys: [
    { name: "name", weight: 3 },
    { name: "seller_name", weight: 2 },
    { name: "category", weight: 1.5 },
    { name: "style", weight: 1 },
    { name: "tags", weight: 1.5 },
    { name: "notes", weight: 0.5 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [hauls, setHauls] = useState<Haul[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFiltersState] = useState<ProductFilters>(DEFAULT_FILTERS);

  // Fuse.js index — rebuilds when products change
  const fuse = useMemo(() => new Fuse(products, FUSE_OPTIONS), [products]);

  // Subscribe to Firestore on auth
  useEffect(() => {
    if (!user) {
      setProducts([]);
      setSellers([]);
      setHauls([]);
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uid = user.uid;
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= 3) setLoading(false);
    };

    const unsubProducts = subscribeProducts(uid, (data) => {
      setProducts(data);
      checkLoaded();
    });
    const unsubSellers = subscribeSellers(uid, (data) => {
      setSellers(data);
      checkLoaded();
    });
    const unsubHauls = subscribeHauls(uid, (data) => {
      setHauls(data);
      checkLoaded();
    });

    getSettings(uid).then(setSettings);

    return () => {
      unsubProducts();
      unsubSellers();
      unsubHauls();
    };
  }, [user]);

  // CRUD wrappers
  const createProduct = useCallback(
    async (data: Omit<Product, "id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      return fbCreateProduct(user.uid, data);
    },
    [user]
  );

  const updateProduct = useCallback(
    async (id: string, data: Partial<Product>) => {
      if (!user) throw new Error("Not authenticated");
      return fbUpdateProduct(user.uid, id, data);
    },
    [user]
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      return fbDeleteProduct(user.uid, id);
    },
    [user]
  );

  const batchUpdateProducts = useCallback(
    async (updates: { id: string; data: Partial<Product> }[]) => {
      if (!user) throw new Error("Not authenticated");
      return fbBatchUpdateProducts(user.uid, updates);
    },
    [user]
  );

  const createSeller = useCallback(
    async (data: Omit<Seller, "id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      return fbCreateSeller(user.uid, data);
    },
    [user]
  );

  const updateSeller = useCallback(
    async (id: string, data: Partial<Seller>) => {
      if (!user) throw new Error("Not authenticated");
      return fbUpdateSeller(user.uid, id, data);
    },
    [user]
  );

  const deleteSeller = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      return fbDeleteSeller(user.uid, id);
    },
    [user]
  );

  const getSellerByUrl = useCallback(
    (yupooUrl: string) => {
      const subdomain = yupooUrl.match(
        /https?:\/\/([^.]+)\.x\.yupoo\.com/
      )?.[1];
      if (!subdomain) return undefined;
      return sellers.find((s) =>
        s.yupoo_url.includes(subdomain)
      );
    },
    [sellers]
  );

  const createHaul = useCallback(
    async (data: Omit<Haul, "id" | "created_at" | "updated_at">) => {
      if (!user) throw new Error("Not authenticated");
      return fbCreateHaul(user.uid, data);
    },
    [user]
  );

  const updateHaul = useCallback(
    async (id: string, data: Partial<Haul>) => {
      if (!user) throw new Error("Not authenticated");
      return fbUpdateHaul(user.uid, id, data);
    },
    [user]
  );

  const deleteHaul = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Not authenticated");
      return fbDeleteHaul(user.uid, id);
    },
    [user]
  );

  const updateSettingsWrapped = useCallback(
    async (data: Partial<UserSettings>) => {
      if (!user) throw new Error("Not authenticated");
      await fbUpdateSettings(user.uid, data);
      setSettings((prev) => (prev ? { ...prev, ...data } : prev));
    },
    [user]
  );

  // Filtering
  const setFilters = useCallback((partial: Partial<ProductFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(DEFAULT_FILTERS);
  }, []);

  const searchProducts = useCallback(
    (query: string) => {
      if (!query.trim()) return products;
      return fuse.search(query).map((r) => r.item);
    },
    [fuse, products]
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    // Fuzzy search
    if (filters.search.trim()) {
      const searchResults = fuse.search(filters.search);
      result = searchResults.map((r) => r.item);
    }

    // Category filter
    if (filters.categories.length > 0) {
      result = result.filter((p) => filters.categories.includes(p.category));
    }

    // Style filter
    if (filters.styles.length > 0) {
      result = result.filter((p) => filters.styles.includes(p.style));
    }

    // Seller filter
    if (filters.sellers.length > 0) {
      result = result.filter((p) => filters.sellers.includes(p.seller_id));
    }

    // Tier filter
    if (filters.tier) {
      result = result.filter((p) => p.tier === filters.tier);
    }

    // Status filter
    if (filters.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    // Rating min
    if (filters.rating_min > 0) {
      result = result.filter((p) => p.rating >= filters.rating_min);
    }

    // Price range
    if (filters.price_min > 0) {
      result = result.filter((p) => p.price_usd >= filters.price_min);
    }
    if (filters.price_max < 10000) {
      result = result.filter((p) => p.price_usd <= filters.price_max);
    }

    // Sort
    const dir = filters.sort_dir === "asc" ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (filters.sort_by) {
        case "price_usd":
          return (a.price_usd - b.price_usd) * dir;
        case "rating":
          return (a.rating - b.rating) * dir;
        case "name":
          return a.name.localeCompare(b.name) * dir;
        case "tier":
          return (
            (TIER_CONFIG[a.tier].order - TIER_CONFIG[b.tier].order) * dir
          );
        case "sort_order":
          return (a.sort_order - b.sort_order) * dir;
        case "created_at":
        default:
          return (a.created_at - b.created_at) * dir;
      }
    });

    return result;
  }, [products, filters, fuse]);

  return (
    <DataContext.Provider
      value={{
        products,
        sellers,
        hauls,
        settings,
        loading,
        createProduct,
        updateProduct,
        deleteProduct,
        batchUpdateProducts,
        createSeller,
        updateSeller,
        deleteSeller,
        getSellerByUrl,
        createHaul,
        updateHaul,
        deleteHaul,
        updateSettings: updateSettingsWrapped,
        filters,
        setFilters,
        resetFilters,
        filteredProducts,
        searchProducts,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
