export interface QuotationLine {
  type: "item" | "service";
  description: string;
  qty: number;
  price: number;
}

export interface QuotationData {
  quoteNo: string;
  date: string;
  items: QuotationLine[];
  vatRate: number;
  discountPercent?: number;
  discountAmount?: number;
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  specs?: string;
  terms?: string;
  validUntil?: string;
}

export interface QuotationParty {
  name: string;
  email?: string;
  company?: string;
  address?: string;
  phone?: string;
  title?: string;
  signature?: string;
  stamp?: string;
}

export interface SiteContact {
  name: string;
  email?: string;
  address?: string;
  phones?: string[];
  vatNo?: string;
}

export const DEFAULT_VALIDITY_DAYS = 30;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function money(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function moneyNPR(n: number): string {
  return `Rs. ${money(n)}`;
}

export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function signatureName(signatory?: string, fallback?: string): string {
  return (signatory ?? "").trim() || (fallback ?? "").trim();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toIsoParts(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function quoteDate(iso?: string): string {
  if (iso) {
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return iso.slice(0, 10);
  }
  return toIsoParts(new Date());
}

export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return toIsoParts(new Date(y, m - 1, d + days));
}

export function validUntil(iso?: string, days = DEFAULT_VALIDITY_DAYS): string {
  return addDaysIso(quoteDate(iso), days);
}

const BS_MONTHS = [
  "Baishakh",
  "Jestha",
  "Ashadh",
  "Shrawan",
  "Bhadra",
  "Ashwin",
  "Kartik",
  "Mangsir",
  "Poush",
  "Magh",
  "Falgun",
  "Chaitra",
];

const BS_EPOCH_MS = Date.UTC(1943, 3, 14);
const BS_DAY_MS = 86400000;

const BS_LENGTHS: number[][] = [
  [30,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,31,32,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,30],
  [31,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,31,32,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,31,32,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,31,29,30,30,29,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,30],
  [31,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,31,32,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,30],
  [31,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,31,32,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,31,29,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,29,30,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [31,31,31,32,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,30],
  [31,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,31,32,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,30],
  [31,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,32,31,32,31,30,30,30,29,29,30,31],
  [30,32,31,32,31,30,30,30,29,30,29,31],
  [31,31,32,31,31,31,30,29,30,29,30,30],
  [31,31,32,31,31,31,30,30,29,30,30,30],
  [30,31,32,32,30,31,30,30,29,30,30,30],
  [30,32,31,32,31,30,30,30,29,30,30,30],
  [30,32,31,32,31,30,30,30,29,30,30,30],
];

export interface BsDateParts {
  year: number;
  month: number;
  day: number;
}

export function bsDateParts(iso?: string): BsDateParts {
  const parts = (iso ?? toIsoParts(new Date())).split("-").map(Number);
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  let days = Math.round((Date.UTC(y, m - 1, d) - BS_EPOCH_MS) / BS_DAY_MS);
  let year = 2000;
  let idx = 0;
  while (idx < BS_LENGTHS.length) {
    const total = BS_LENGTHS[idx].reduce((a, b) => a + b, 0);
    if (days < total) break;
    days -= total;
    year += 1;
    idx += 1;
  }
  const lengths = BS_LENGTHS[idx] ?? BS_LENGTHS[BS_LENGTHS.length - 1];
  let rem = days;
  for (let mi = 0; mi < 12; mi++) {
    if (rem < lengths[mi]) {
      return { year, month: mi + 1, day: rem + 1 };
    }
    rem -= lengths[mi];
  }
  return { year, month: 1, day: 1 };
}

export function bsDate(iso?: string): string {
  const p = bsDateParts(iso);
  return `${p.day} ${BS_MONTHS[p.month - 1]} ${p.year}`;
}

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function nepaliDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (d) => NEPALI_DIGITS[Number(d)]);
}

export function bsDateNepali(iso?: string): string {
  const p = bsDateParts(iso);
  const mm = String(p.month).padStart(2, "0");
  const dd = String(p.day).padStart(2, "0");
  return `${nepaliDigits(p.year)}/${nepaliDigits(mm)}/${nepaliDigits(dd)}`;
}

const ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const TENS = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? " " + ONES[o] : "");
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let s = "";
  if (h) s += ONES[h] + " Hundred";
  if (rest) s += (s ? " " : "") + twoDigits(rest);
  return s;
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paisa = Math.round((amount - rupees) * 100);
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const rest = rupees % 1000;
  const parts: string[] = [];
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (rest) parts.push(threeDigits(rest));
  const words = parts.join(" ");
  if (!words) {
    return paisa > 0 ? `${twoDigits(paisa)} Paisa Only` : "Zero Rupees Only";
  }
  if (paisa > 0) {
    return `${words} Rupees and ${twoDigits(paisa)} Paisa Only`;
  }
  return `${words} Rupees Only`;
}

interface RenderOptions {
  origin: string;
  company: SiteContact;
  quote: QuotationData;
  preparedBy: QuotationParty;
  billTo: QuotationParty;
  letterhead: boolean;
  showToolbar?: boolean;
  variant?: "print" | "email";
  logoSrc?: string;
}

function partyBlock(title: string, party: QuotationParty): string {
  const lines = [party.name, party.company, party.address, party.phone, party.email]
    .filter((v): v is string => Boolean(v))
    .map(esc);
  return `
    <div class="party">
      <div class="party-title">${esc(title)}</div>
      <div>${lines.join("<br>")}</div>
    </div>`;
}

function itemsTable(rows: QuotationLine[], label: string): string {
  const body = rows
    .map(
      (r, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>${esc(r.description)}</td>
        <td class="c">${r.qty}</td>
        <td class="r">${money(r.price)}</td>
        <td class="r">${money(round2(r.qty * r.price))}</td>
      </tr>`
    )
    .join("");
  return `
    <h2 class="sec">${esc(label)}</h2>
    <table class="items">
      <thead>
        <tr>
          <th class="c" style="width:36px">SN</th>
          <th>Description</th>
          <th class="c" style="width:46px">Qty</th>
          <th class="r" style="width:110px">Unit Price (RS)</th>
          <th class="r" style="width:120px">Amount (RS)</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

function totalsTable(quote: QuotationData): string {
  if (quote.items.length === 0) return "";
  const rows: string[] = [
    `<tr><td class="tot-label">Subtotal</td><td class="r">${money(quote.subtotal)}</td></tr>`,
  ];
  if (quote.discountAmount) {
    rows.push(
      `<tr><td class="tot-label">Discount (${quote.discountPercent}%)</td><td class="r">−${money(quote.discountAmount)}</td></tr>`,
      `<tr><td class="tot-label">After discount</td><td class="r">${money(round2(quote.subtotal - quote.discountAmount))}</td></tr>`
    );
  }
  const vatLabel = `VAT ${quote.vatRate.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
  rows.push(
    `<tr><td class="tot-label">${vatLabel}</td><td class="r">${money(quote.vat)}</td></tr>`,
    `<tr class="gt"><td class="tot-label">Total</td><td class="r">${money(quote.total)}</td></tr>`
  );
  return `<table class="totals"><tbody>${rows.join("")}</tbody></table>`;
}

export function renderQuotationHtml(opts: RenderOptions): string {
  const { origin, company, quote, preparedBy, billTo, letterhead } = opts;
  const variant = opts.variant === "email" ? "email" : "print";
  const isPrint = variant === "print";
  const showToolbar = isPrint && (opts.showToolbar ?? true);
  const noLetterhead = isPrint && !letterhead ? " no-letterhead" : "";
  const logoSrc = opts.logoSrc || `${origin}/images/logo.png`;

  const products = quote.items.filter((i) => i.type === "item");
  const services = quote.items.filter((i) => i.type === "service");

  const contactLine = [company.email, ...(company.phones ?? [])]
    .filter(Boolean)
    .join(" · ");
  const tagline = [
    company.address,
    contactLine,
    company.vatNo ? `PAN/VAT: ${company.vatNo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const footerLine = [
    company.name,
    company.address,
    contactLine,
    company.vatNo ? `PAN/VAT: ${company.vatNo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const productsBlock = products.length
    ? itemsTable(products, "Financial Proposal")
    : "";
  const servicesBlock = services.length ? itemsTable(services, "Services") : "";

  const validUntilDate = quote.validUntil ?? validUntil(quote.date);

  const notesBlock = quote.notes
    ? `<div class="notes"><strong>Notes:</strong><br>${esc(quote.notes)}</div>`
    : "";

  const specsBlock = quote.specs
    ? `
    <div class="page-break"></div>
    <h2 class="sec">Product Description</h2>
    <div class="free-text">${esc(quote.specs)}</div>`
    : "";

  const termsBlock = quote.terms
    ? `
    <div class="page-break"></div>
    <h2 class="sec">Terms &amp; Conditions</h2>
    <div class="free-text">${esc(quote.terms)}</div>`
    : "";

  const toolbar = showToolbar
    ? `
      <div class="toolbar">
        <strong style="font-size:13px">Quotation ${esc(quote.quoteNo)}</strong>
        <span style="flex:1"></span>
        <button class="tb-btn" onclick="document.body.classList.remove('no-letterhead');window.print()">Print with letterhead</button>
        <button class="tb-btn" onclick="document.body.classList.add('no-letterhead');window.print()">Print without letterhead</button>
      </div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Quotation ${esc(quote.quoteNo)} — ${esc(company.name)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    color: #2c303c;
    background: ${isPrint ? "#e2e8f0" : "#f4f5f7"};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: ${isPrint ? "210mm" : "100%"};
    max-width: ${isPrint ? "none" : "720px"};
    ${isPrint
      ? "min-height: 297mm; padding: 10mm 14mm 14mm; margin: 16px auto; box-shadow: 0 4px 24px rgba(15,23,42,.15);"
      : "margin: 24px auto; padding: 24px 30px; box-shadow: 0 1px 3px rgba(15,23,42,.08);"}
    background: #fff;
    position: relative;
    font-size: 12.5pt;
    line-height: 1.5;
  }
  .letterhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 4px 0 10px;
    border-bottom: 2px solid #e2e7f0;
  }
  .lh-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .lh-left .logo { height: 52px; width: auto; }
  .lh-left .nm { font-size: 14pt; font-weight: 700; color: #c0141b; }
  .lh-left .tag { font-size: 12.5pt; color: #2c303c; margin-top: 1px; }
  .lh-right { text-align: right; flex-shrink: 0; }
  .lh-right .q-title {
    font-size: 24pt;
    font-weight: 700;
    color: #1c2333;
    letter-spacing: .12em;
    line-height: 1.1;
  }
  .lh-right .q-no { font-size: 12.5pt; font-weight: 700; color: #1c2333; margin-top: 3px; }
  .lh-right .q-meta { font-size: 12.5pt; color: #1c2333; margin-top: 1px; }
  .to-block { margin-top: 16px; }
  .party-title { font-weight: 700; }
  .subject { font-weight: 700; color: #1c2333; margin: 12px 0 4px; }
  .body-text { margin: 4px 0 10px; }
  .sec {
    font-size: 14pt;
    font-weight: 700;
    color: #1c2333;
    margin: 16px 0 6px;
    letter-spacing: .02em;
  }
  table.items {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5pt;
  }
  table.items th {
    background: #e2e7f0;
    color: #1c2333;
    font-weight: 700;
    border: 1px solid #999999;
    padding: 6px 8px;
    text-align: left;
  }
  table.items td {
    border: 1px solid #999999;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  table.items tbody tr:nth-child(even) { background: #f0f2f7; }
  table.items .c { text-align: center; }
  table.items .r { text-align: right; white-space: nowrap; }
  table.totals {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5pt;
  }
  table.totals td { border: 0; border-top: 1px solid #999999; padding: 5px 8px; }
  table.totals .tot-label { width: 70%; padding-left: 0; }
  table.totals .r { text-align: right; white-space: nowrap; }
  table.totals tr.gt td { font-weight: 700; border-top: 2px solid #1c2333; }
  .in-words { margin: 12px 0; font-weight: 700; }
  .in-words span { font-weight: 400; }
  .closing { margin-top: 10px; }
  .sign { margin-top: 22px; line-height: 1.5; }
  .sign .sigrow { display: flex; align-items: flex-end; gap: 20px; margin: 0 0 6px; }
  .sign .sig { display: inline-block; height: 120px; width: auto; max-width: 220px; max-height: 130px; object-fit: contain; object-position: left center; }
  .sign .stamp { display: inline-block; height: 132px; width: auto; max-width: 260px; max-height: 142px; object-fit: contain; object-position: left center; }
  .sign .for { margin-top: 16px; border-top: 1px solid #1c2333; padding-top: 4px; width: 260px; }
  .notes {
    margin-top: 12px;
    white-space: pre-wrap;
    background: #f0f2f7;
    border: 1px solid #e2e7f0;
    padding: 8px 10px;
    font-size: 11pt;
  }
  .free-text { white-space: pre-wrap; }
  .page-break { height: 12px; }
  .footer {
    margin-top: 26px;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
    font-size: 9.5pt;
    color: #6b7280;
    text-align: center;
  }
  .toolbar {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #0f172a;
    color: #fff;
    padding: 10px 14px;
    font-family: Arial, sans-serif;
  }
  .tb-btn {
    background: #c0141b;
    color: #fff;
    border: 0;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .tb-btn:hover { background: #a00f15; }
  .no-letterhead .letterhead { display: none; }
  .no-letterhead .footer { display: none; }
  ${isPrint ? `@media print {
    @page { size: A4; margin: 12mm 14mm; }
    body { background: #fff; }
    .sheet { margin: 0; width: auto; min-height: auto; box-shadow: none; padding: 0; }
    .toolbar { display: none; }
    .items, table.totals, .sign, .notes, .free-text { page-break-inside: avoid; }
    .page-break { page-break-before: always; height: 0; }
    table.items tr, .subject, .sec { page-break-after: avoid; }
  }` : ""}
</style>
</head>
<body class="${noLetterhead.trim() || "with-letterhead"}">
  ${toolbar}
  <div class="sheet">
    <div class="letterhead">
      <div class="lh-left">
        <img class="logo" src="${logoSrc}" alt="${esc(company.name)}">
        <div>
          <div class="nm">${esc(company.name)}</div>
          <div class="tag">${esc(tagline)}</div>
        </div>
      </div>
      <div class="lh-right">
        <div class="q-title">QUOTATION</div>
        <div class="q-no">${esc(quote.quoteNo)}</div>
        <div class="q-meta">Date: ${esc(quote.date)}</div>
        <div class="q-meta">BS ${esc(bsDate(quote.date))}</div>
        <div class="q-meta">Valid until: ${esc(validUntilDate)}</div>
      </div>
    </div>

    <div class="to-block">
      ${partyBlock("To", billTo)}
    </div>

    <div class="subject">Subject: Quotation ${esc(quote.quoteNo)} for ${esc(billTo.company || billTo.name)}</div>
    <div class="body-text">
      Dear Sir/Madam,<br><br>
      Thank you for the opportunity to submit our offer to ${esc(billTo.company || billTo.name)}.
      Based on your requirement we are pleased to quote for the goods and services listed below.
      The financial proposal and the terms on which we would deliver it are set out below.
    </div>

    ${productsBlock}
    ${servicesBlock}

    ${totalsTable(quote)}

    <div class="in-words">In words: <span>${esc(amountInWords(quote.total))}</span></div>

    <div class="body-text">Validity: this quotation is valid until ${esc(validUntilDate)}.</div>

    ${notesBlock}

    <div class="body-text closing">
      We look forward to working with ${esc(billTo.company || billTo.name)}. Please contact us if you
      require any clarification regarding this proposal.
    </div>

    <div class="sign">
      Sincerely,<br><br>
      <div class="sigrow">
        ${
          preparedBy.signature
            ? `<img class="sig" src="${preparedBy.signature}" alt="">`
            : ""
        }
        ${
          preparedBy.stamp
            ? `<img class="stamp" src="${preparedBy.stamp}" alt="">`
            : ""
        }
      </div>
      ${esc(preparedBy.name || "")}<br>
      ${preparedBy.title ? `${esc(preparedBy.title)}<br>` : ""}
      ${esc(contactLine)}
      <div class="for">For ${esc(company.name)}</div>
    </div>

    ${specsBlock}
    ${termsBlock}

    <div class="footer">${esc(footerLine)}</div>
  </div>
</body>
</html>`;
}
