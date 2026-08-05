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
  notes: string;
}

export interface QuotationParty {
  name: string;
  email?: string;
  company?: string;
  address?: string;
  phone?: string;
}

export interface SiteContact {
  name: string;
  email?: string;
  address?: string;
  phones?: string[];
  vatNo?: string;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function money(n: number): string {
  return `NPR ${n.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function quoteDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
}

function itemsTable(rows: QuotationLine[], label: string): string {
  const body = rows
    .map(
      (r) =>
        `<tr>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:center">${r.qty}</td>
          <td style="border:1px solid #d1d5db;padding:6px">${esc(r.description)}</td>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:right">${money(r.price)}</td>
          <td style="border:1px solid #d1d5db;padding:6px;text-align:right">${money(r.qty * r.price)}</td>
        </tr>`
    )
    .join("");
  return `
    <h3 style="font-size:12px;margin:14px 0 6px">${label}</h3>
    <table style="border-collapse:collapse;width:100%;font-size:11px">
      <thead>
        <tr style="background:#f9fafb">
          <th style="border:1px solid #d1d5db;padding:6px;text-align:center;width:42px">Qty</th>
          <th style="border:1px solid #d1d5db;padding:6px;text-align:left">Description</th>
          <th style="border:1px solid #d1d5db;padding:6px;text-align:right;width:110px">Unit Price</th>
          <th style="border:1px solid #d1d5db;padding:6px;text-align:right;width:120px">Amount</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
    </table>`;
}

function partyBlock(title: string, party: QuotationParty, meta: string): string {
  const lines = [party.name, party.company, party.address, party.phone, party.email]
    .filter((v): v is string => Boolean(v))
    .map(esc);
  return `
    <div style="font-weight:bold;font-size:12px;margin-bottom:2px">${title}</div>
    <div style="font-size:11px;color:#374151">${lines.join("<br>")}${meta ? `<br><span style="color:#6b7280">${esc(meta)}</span>` : ""}</div>`;
}

export function renderQuotationHtml(opts: RenderOptions): string {
  const { origin, company, quote, preparedBy, billTo, letterhead } = opts;
  const variant = opts.variant === "email" ? "email" : "print";
  const isPrint = variant === "print";
  const showToolbar = isPrint && (opts.showToolbar ?? true);
  const noLetterhead = isPrint && !letterhead ? " no-letterhead" : "";

  const products = quote.items.filter((i) => i.type === "item");
  const services = quote.items.filter((i) => i.type === "service");

  const contactLine = [
    company.email,
    ...(company.phones ?? []),
  ].join(" · ");
  const headerCompany =
    [company.name, company.address, contactLine].filter(Boolean).join(" · ");

  const footerLine = [
    company.name,
    company.address,
    contactLine,
    company.vatNo ? `PAN/VAT: ${company.vatNo}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const productsBlock = products.length ? itemsTable(products, "Products") : "";
  const servicesBlock = services.length ? itemsTable(services, "Services") : "";

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
    font-family: Arial, Helvetica, sans-serif;
    color: #1f2937;
    background: ${isPrint ? "#e2e8f0" : "#f4f5f7"};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: ${isPrint ? "210mm" : "100%"};
    max-width: ${isPrint ? "none" : "700px"};
    ${isPrint
      ? "min-height: 297mm; padding: 0 14mm; margin: 16px auto; box-shadow: 0 4px 24px rgba(15,23,42,.15);"
      : "margin: 24px auto; padding: 24px 30px; box-shadow: 0 1px 3px rgba(15,23,42,.08);"}
    background: #fff;
    position: relative;
  }
  .letterhead {
    padding: 18px 0 12px;
    border-bottom: 3px solid #f06020;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .letterhead .logo { height: 46px; width: auto; }
  .letterhead .co { flex: 1; }
  .letterhead .co .nm { font-size: 19px; font-weight: bold; color: #1f2937; }
  .letterhead .co .dt { font-size: 10.5px; color: #6b7280; margin-top: 2px; line-height: 1.45; }
  .sheet h1 {
    font-size: 18px;
    letter-spacing: .12em;
    margin: 22px 0 6px;
    text-align: center;
    color: #111827;
  }
  .ref { text-align: center; font-size: 11px; color: #6b7280; margin-bottom: 18px; }
  .party-row {
    display: flex;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 8px;
  }
  .party-row > div { max-width: 50%; }
  .totals { margin: 12px 0 0 auto; width: 260px; font-size: 11.5px; border-collapse: collapse; }
  .totals td { padding: 4px 10px; }
  .totals .gt { font-weight: bold; font-size: 13px; border-top: 2px solid #111827; }
  .sign {
    margin-top: 42px;
    display: flex;
    justify-content: space-between;
    gap: 24px;
    font-size: 11px;
    color: #374151;
  }
  .sign .blk { width: 45%; }
  .sign .line { border-top: 1px solid #111827; margin-top: 34px; padding-top: 4px; }
  .notes { margin-top: 14px; font-size: 11px; color: #374151; white-space: pre-wrap; }
  .footer {
    margin-top: 28px;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
    font-size: 9.5px;
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
    background: #f06020;
    color: #fff;
    border: 0;
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .tb-btn:hover { background: #e05010; }
  .no-letterhead .letterhead { display: none; }
  .no-letterhead .footer { display: none; }
  ${isPrint ? `@media print {
    @page { size: A4; margin: 12mm 14mm; }
    body { background: #fff; }
    .sheet { margin: 0; width: auto; min-height: auto; box-shadow: none; padding: 0; }
    .toolbar { display: none; }
    .party-row, table, .totals, .sign, .notes { page-break-inside: avoid; }
  }` : ""}
</style>
</head>
<body class="${noLetterhead.trim() || "with-letterhead"}">
  ${toolbar}
  <div class="sheet">
    <div class="letterhead">
      <img class="logo" src="${origin}/images/logo.png" alt="${esc(company.name)}">
      <div class="co">
        <div class="nm">${esc(headerCompany)}</div>
        <div class="dt">${esc(company.email ?? "")} · ${esc(contactLine)}${company.vatNo ? ` · PAN/VAT: ${esc(company.vatNo)}` : ""}</div>
      </div>
    </div>

    <h1>QUOTATION</h1>
    <div class="ref">Ref: ${esc(quote.quoteNo)} · Date: ${esc(quote.date)} · Valid for 30 days</div>

    <div class="party-row">
      ${partyBlock("Prepared for:", billTo, "")}
      ${partyBlock("Prepared by:", preparedBy, "")}
    </div>

    ${productsBlock}
    ${servicesBlock}

    <table class="totals">
      <tr><td>Subtotal</td><td style="text-align:right">${money(quote.subtotal)}</td></tr>
      ${
        quote.discountAmount
          ? `<tr><td>Discount (${quote.discountPercent}%)</td><td style="text-align:right">−${money(quote.discountAmount)}</td></tr>
      <tr><td>After discount</td><td style="text-align:right">${money(quote.subtotal - quote.discountAmount)}</td></tr>`
          : ""
      }
      <tr><td>VAT (${quote.vatRate}%)</td><td style="text-align:right">${money(quote.vat)}</td></tr>
      <tr class="gt"><td>Grand Total</td><td style="text-align:right">${money(quote.total)}</td></tr>
    </table>

    ${quote.notes ? `<div class="notes"><strong>Notes:</strong>\n${esc(quote.notes)}</div>` : ""}

    <div class="sign">
      <div class="blk">For ${esc(company.name)}<div class="line">${esc(preparedBy.name || "")}</div></div>
      <div class="blk" style="text-align:right">Authorised Signature<div class="line"></div></div>
    </div>

    <div class="footer">${esc(footerLine)}</div>
  </div>
</body>
</html>`;
}
