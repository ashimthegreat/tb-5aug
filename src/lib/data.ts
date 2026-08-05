import "server-only";
import { readJson } from "./store";

export const siteName = "TechBucket";
export const siteUrl = "https://techbucket.com.np";

export interface ContactInfo {
  email: string;
  phones: { label: string; href: string }[];
  address: string;
  vatNo: string;
  heading: string;
  subheading: string;
}

export interface SiteContent {
  name: string;
  url: string;
  tagline: string;
  hero: { eyebrow: string; title: string; subtitle: string };
  about: { title: string; paragraphs: string[] };
  stats: { value: string; label: string }[];
  trustPoints: { title: string; description: string }[];
  mission: { title: string; body: string };
  vision: { title: string; body: string };
  values: { title: string; body: string }[];
  contact: ContactInfo;
  footer: { blurb: string };
}

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
}

export interface Service {
  id: string;
  categoryId: string;
  icon: string;
  title: string;
  description: string;
  order: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  order: number;
}

export type ProductStock = "in-stock" | "out-of-stock" | "on-order";
export type PurchaseType = "purchase" | "quote" | "both";

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  images: string[];
  price: number;
  salePrice: number | null;
  currency: string;
  stock: ProductStock;
  purchaseType: PurchaseType;
  summary: string;
  description: string;
  specs: { label: string; value: string }[];
  features: string[];
  featured: boolean;
  active: boolean;
  order: number;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
  url?: string;
  blurb: string;
  order: number;
}

export interface Partner {
  id: string;
  name: string;
  logo?: string;
  url?: string;
  order: number;
}

export interface CareerPerk {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface CareersContent {
  perks: CareerPerk[];
  positionsTitle: string;
  emptyTitle: string;
  emptyMessage: string;
  emptyCta: string;
  speculativeTitle: string;
  speculativeMessage: string;
  speculativeCta: string;
}

export async function getSite(): Promise<SiteContent> {
  return readJson<SiteContent>("site.json");
}

export async function getCategories(): Promise<ServiceCategory[]> {
  return readJson<ServiceCategory[]>("categories.json");
}

export async function getServices(): Promise<Service[]> {
  return readJson<Service[]>("services.json");
}

export async function getProducts(): Promise<Product[]> {
  return readJson<Product[]>("products.json");
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  return readJson<ProductCategory[]>("product-categories.json");
}

export async function getBrands(): Promise<Brand[]> {
  return readJson<Brand[]>("brands.json");
}

export async function getPartners(): Promise<Partner[]> {
  return readJson<Partner[]>("partners.json");
}

export async function getCareers(): Promise<CareersContent> {
  return readJson<CareersContent>("careers.json");
}
