import "server-only";
import { readJson } from "./store";

export const siteName = "TechBucket";
export const siteUrl = "https://techbucket.com.np";

async function safeReadJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return await readJson<T>(file);
  } catch {
    return fallback;
  }
}

const EMPTY_SITE: SiteContent = {
  name: siteName,
  url: siteUrl,
  tagline: "",
  hero: { eyebrow: "", title: "", subtitle: "" },
  about: { title: "", paragraphs: [] },
  stats: [],
  mission: { title: "", body: "" },
  vision: { title: "", body: "" },
  values: [],
  contact: {
    email: "",
    phones: [],
    address: "",
    vatNo: "",
    heading: "",
    subheading: "",
  },
  footer: { blurb: "" },
};

const EMPTY_CAREERS: CareersContent = {
  perks: [],
  positionsTitle: "",
  emptyTitle: "",
  emptyMessage: "",
  emptyCta: "",
  speculativeTitle: "",
  speculativeMessage: "",
  speculativeCta: "",
};

export interface ProcessStep {
  icon: string;
  title: string;
  description: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  org: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface Insight {
  eyebrow: string;
  title: string;
  excerpt: string;
  href: string;
}

export interface CaseItem {
  icon: string;
  title: string;
  summary: string;
  href: string;
}

export interface HomeContent {
  statsSubline: string;
  process: {
    eyebrow: string;
    title: string;
    description: string;
    steps: ProcessStep[];
  };
  testimonials: {
    eyebrow: string;
    title: string;
    description: string;
    items: Testimonial[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: FaqItem[];
  };
  insights: {
    eyebrow: string;
    title: string;
    description: string;
    items: Insight[];
  };
  cases: {
    eyebrow: string;
    title: string;
    description: string;
    items: CaseItem[];
  };
}

const EMPTY_HOME: HomeContent = {
  statsSubline: "",
  process: { eyebrow: "", title: "", description: "", steps: [] },
  testimonials: { eyebrow: "", title: "", description: "", items: [] },
  faq: { eyebrow: "", title: "", description: "", items: [] },
  insights: { eyebrow: "", title: "", description: "", items: [] },
  cases: { eyebrow: "", title: "", description: "", items: [] },
};

export interface ContactInfo {
  email: string;
  phones: { label: string; href: string }[];
  address: string;
  vatNo: string;
  heading: string;
  subheading: string;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string;
  branch?: string;
}

export interface SiteContent {
  name: string;
  url: string;
  tagline: string;
  hero: { eyebrow: string; title: string; subtitle: string };
  about: { title: string; paragraphs: string[] };
  stats: { value: string; label: string }[];
  mission: { title: string; body: string };
  vision: { title: string; body: string };
  values: { title: string; body: string }[];
  contact: ContactInfo;
  bank?: BankDetails;
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

export interface Industry {
  id: string;
  name: string;
  icon: string;
  description: string;
  services: string[];
  productsOnly?: boolean;
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
  return safeReadJson<SiteContent>("site.json", EMPTY_SITE);
}

export async function getCategories(): Promise<ServiceCategory[]> {
  return safeReadJson<ServiceCategory[]>("categories.json", []);
}

export async function getServices(): Promise<Service[]> {
  return safeReadJson<Service[]>("services.json", []);
}

export async function getIndustries(): Promise<Industry[]> {
  return safeReadJson<Industry[]>("industries.json", []);
}

export async function getHome(): Promise<HomeContent> {
  return safeReadJson<HomeContent>("home.json", EMPTY_HOME);
}

export async function getProducts(): Promise<Product[]> {
  return safeReadJson<Product[]>("products.json", []);
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  return safeReadJson<ProductCategory[]>("product-categories.json", []);
}

export async function getBrands(): Promise<Brand[]> {
  return safeReadJson<Brand[]>("brands.json", []);
}

export async function getPartners(): Promise<Partner[]> {
  return safeReadJson<Partner[]>("partners.json", []);
}

export async function getCareers(): Promise<CareersContent> {
  return safeReadJson<CareersContent>("careers.json", EMPTY_CAREERS);
}
