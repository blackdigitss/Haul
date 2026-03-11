import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Product,
  Seller,
  Haul,
  UserSettings,
} from "@/types";
import {
  DEFAULT_CATEGORIES,
  DEFAULT_STYLES,
  DEFAULT_BRANDS,
} from "@/types";
import { generateId } from "./utils";

// Strip undefined values from an object before sending to Firestore
// (Firestore rejects `undefined` values)
function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const result = {} as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result as T;
}

// ============================================================
// Collection Paths
// ============================================================

function userPath(userId: string) {
  return `users/${userId}`;
}

function productsCol(userId: string) {
  return collection(db, userPath(userId), "products");
}

function sellersCol(userId: string) {
  return collection(db, userPath(userId), "sellers");
}

function haulsCol(userId: string) {
  return collection(db, userPath(userId), "hauls");
}

function settingsDoc(userId: string) {
  return doc(db, userPath(userId), "settings", "preferences");
}

// ============================================================
// Products
// ============================================================

export async function createProduct(
  userId: string,
  data: Omit<Product, "id" | "created_at" | "updated_at">
): Promise<Product> {
  const id = generateId();
  const now = Date.now();
  const product: Product = { ...data, id, created_at: now, updated_at: now };
  await setDoc(doc(productsCol(userId), id), stripUndefined(product as unknown as Record<string, unknown>) as unknown as Product);
  return product;
}

export async function updateProduct(
  userId: string,
  id: string,
  data: Partial<Product>
): Promise<void> {
  await updateDoc(doc(productsCol(userId), id), stripUndefined({
    ...data,
    updated_at: Date.now(),
  } as Record<string, unknown>));
}

export async function deleteProduct(
  userId: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(productsCol(userId), id));
}

export async function getProduct(
  userId: string,
  id: string
): Promise<Product | null> {
  const snap = await getDoc(doc(productsCol(userId), id));
  return snap.exists() ? (snap.data() as Product) : null;
}

export async function getAllProducts(userId: string): Promise<Product[]> {
  const q = query(productsCol(userId), orderBy("created_at", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as Product);
}

export function subscribeProducts(
  userId: string,
  callback: (products: Product[]) => void
): Unsubscribe {
  const q = query(productsCol(userId), orderBy("created_at", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Product));
  });
}

export async function batchUpdateProducts(
  userId: string,
  updates: { id: string; data: Partial<Product> }[]
): Promise<void> {
  const batch = writeBatch(db);
  const now = Date.now();
  for (const { id, data } of updates) {
    batch.update(doc(productsCol(userId), id), { ...data, updated_at: now });
  }
  await batch.commit();
}

// ============================================================
// Sellers
// ============================================================

export async function createSeller(
  userId: string,
  data: Omit<Seller, "id" | "created_at" | "updated_at">
): Promise<Seller> {
  const id = generateId();
  const now = Date.now();
  const seller: Seller = { ...data, id, created_at: now, updated_at: now };
  await setDoc(doc(sellersCol(userId), id), seller);
  return seller;
}

export async function updateSeller(
  userId: string,
  id: string,
  data: Partial<Seller>
): Promise<void> {
  await updateDoc(doc(sellersCol(userId), id), stripUndefined({
    ...data,
    updated_at: Date.now(),
  } as Record<string, unknown>));
}

export async function deleteSeller(
  userId: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(sellersCol(userId), id));
}

export async function getSeller(
  userId: string,
  id: string
): Promise<Seller | null> {
  const snap = await getDoc(doc(sellersCol(userId), id));
  return snap.exists() ? (snap.data() as Seller) : null;
}

export function subscribeSellers(
  userId: string,
  callback: (sellers: Seller[]) => void
): Unsubscribe {
  const q = query(sellersCol(userId), orderBy("created_at", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Seller));
  });
}

// ============================================================
// Hauls
// ============================================================

export async function createHaul(
  userId: string,
  data: Omit<Haul, "id" | "created_at" | "updated_at">
): Promise<Haul> {
  const id = generateId();
  const now = Date.now();
  const haul: Haul = { ...data, id, created_at: now, updated_at: now };
  await setDoc(doc(haulsCol(userId), id), haul);
  return haul;
}

export async function updateHaul(
  userId: string,
  id: string,
  data: Partial<Haul>
): Promise<void> {
  await updateDoc(doc(haulsCol(userId), id), {
    ...data,
    updated_at: Date.now(),
  });
}

export async function deleteHaul(
  userId: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(haulsCol(userId), id));
}

export function subscribeHauls(
  userId: string,
  callback: (hauls: Haul[]) => void
): Unsubscribe {
  const q = query(haulsCol(userId), orderBy("created_at", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => d.data() as Haul));
  });
}

// ============================================================
// Settings
// ============================================================

export async function getSettings(
  userId: string
): Promise<UserSettings> {
  const snap = await getDoc(settingsDoc(userId));
  if (snap.exists()) return snap.data() as UserSettings;

  const defaults: UserSettings = {
    categories: [...DEFAULT_CATEGORIES],
    styles: [...DEFAULT_STYLES],
    brands: [...DEFAULT_BRANDS],
    preferred_currency: "USD",
    theme: "dark",
  };
  await setDoc(settingsDoc(userId), defaults);
  return defaults;
}

export async function updateSettings(
  userId: string,
  data: Partial<UserSettings>
): Promise<void> {
  await updateDoc(settingsDoc(userId), data);
}
