import {
  amountInWords,
  bsDate,
  esc,
  money,
  round2,
  type SiteContact,
} from "./quotation";

export interface BillLine {
  type: "item" | "service";
  description: string;
  qty: number;
  price: number;
}

export interface BillData {
  billNo: string;
  orderNo?: string;
  quoteNo?: string;
  date: string;
  items: BillLine[];
  vatRate: number;
  discountPercent?: number;
  discountAmount?: number;
  subtotal: number;
  vat: number;
  total: number;
  notes?: string;
  dueDate?: string;
  paid?: number;
  received?: boolean;
}

export interface BillParty {
  name: string;
  email?: string;
  company?: string;
  address?: string;
  phone?: string;
  signature?: string;
  stamp?: string;
  title?: string;
}

interface BillRenderOptions {
  origin: string;
  company: SiteContact;
  bill: BillData;
  billedBy: BillParty;
  billTo: BillParty;
  letterhead: boolean;
  showToolbar?: boolean;
  logoSrc?: string;
}

function partyBlock(title: string, party: BillParty): string {
  const lines = [party.name, party.company, party.address, party.phone, party.email]
    .filter((v): v is string => Boolean(v))
    .map(esc);
  return `
    <div class="party">
      <div class="party-title">${esc(title)}</div>
      <div>${lines.join("<br>")}</div>
    </div>`;
}

function itemsTable(rows: BillLine[]): string {
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
    <h2 class="sec">Items</h2>
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

function totalsTable(bill: BillData): string {
  if (bill.items.length === 0) return "";
  const rows: string[] = [
    `<tr><td class="tot-label">Subtotal</td><td class="r">${money(bill.subtotal)}</td></tr>`,
  ];
  if (bill.discountAmount) {
    rows.push(
      `<tr><td class="tot-label">Discount (${bill.discountPercent}%)</td><td class="r">−${money(bill.discountAmount)}</td></tr>`,
      `<tr><td class="tot-label">After discount</td><td class="r">${money(round2(bill.subtotal - bill.discountAmount))}</td></tr>`
    );
  }
  const vatLabel = `VAT ${bill.vatRate.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
  rows.push(
    `<tr><td class="tot-label">${vatLabel}</td><td class="r">${money(bill.vat)}</td></tr>`,
    `<tr class="gt"><td class="tot-label">Total</td><td class="r">${money(bill.total)}</td></tr>`
  );
  return `<table class="totals"><tbody>${rows.join("")}</tbody></table>`;
}

function paymentBox(bill: BillData): string {
  if (!bill.dueDate) return "";
  const paid = bill.paid ?? 0;
  const balance = Math.round((bill.total - paid) * 100) / 100;
  const received = bill.received ?? balance <= 0;
  const status = received
    ? "PAID"
    : balance > 0 && balance < bill.total
      ? "PARTIALLY PAID"
      : "UNPAID";
  const rows = received
    ? `<tr class="gt"><td class="tot-label">Amount Paid</td><td class="r">${money(paid)}</td></tr>
       <tr class="paid-ok"><td class="tot-label">Balance Due</td><td class="r">0</td></tr>`
    : `<tr><td class="tot-label">Amount Paid</td><td class="r">${money(paid)}</td></tr>
       <tr class="balance-due"><td class="tot-label">Balance Due</td><td class="r">${money(balance)}</td></tr>`;
  return `
    <div class="payment-box${received ? " pb-received" : ""}">
      <div class="pb-head">${status}</div>
      <table class="totals payment-cols"><tbody>
        <tr><td class="tot-label">Bill Date</td><td class="r">${esc(bill.date)}</td></tr>
        <tr><td class="tot-label">Due Date</td><td class="r">${esc(bill.dueDate)} (BS ${esc(bsDate(bill.dueDate))})</td></tr>
        <tr><td class="tot-label">Total</td><td class="r">${money(bill.total)}</td></tr>
        ${rows}
      </tbody></table>
    </div>`;
}

export function renderBillHtml(opts: BillRenderOptions): string {
  const { origin, company, bill, billedBy, billTo, letterhead } = opts;
  const showToolbar = opts.showToolbar ?? true;
  const noLetterhead = !letterhead ? " no-letterhead" : "";
  const logoSrc = opts.logoSrc || `${origin}/images/logo.png`;

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

  const notesBlock = bill.notes
    ? `<div class="notes"><strong>Notes:</strong><br>${esc(bill.notes)}</div>`
    : "";

  const refs = [
    bill.orderNo ? `Order: ${esc(bill.orderNo)}` : "",
    bill.quoteNo ? `Quote: ${esc(bill.quoteNo)}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const toolbar = showToolbar
    ? `
      <div class="toolbar">
        <strong style="font-size:13px">Bill ${esc(bill.billNo)}</strong>
        <span style="flex:1"></span>
        <button class="tb-btn tb-btn-primary" onclick="window.print()">Print</button>
        <button class="tb-btn" onclick="document.body.classList.remove('no-letterhead');window.print()">Print with letterhead</button>
        <button class="tb-btn" onclick="document.body.classList.add('no-letterhead');window.print()">Print without letterhead</button>
      </div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Bill ${esc(bill.billNo)} — ${esc(company.name)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
    color: #2c303c;
    background: #e2e8f0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: 210mm;
    max-width: none;
    min-height: 297mm;
    padding: 10mm 14mm 14mm;
    margin: 16px auto;
    box-shadow: 0 4px 24px rgba(15,23,42,.15);
    background: #fff;
    position: relative;
    display: flex;
    flex-direction: column;
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
  .payment-box { margin-top: 14px; border: 1.5px solid #c0141b; border-radius: 8px; padding: 8px 12px 10px; }
  .payment-box .pb-head { font-weight: 800; font-size: 13pt; letter-spacing: .06em; color: #c0141b; }
  .payment-box.pb-received { border-color: #15983d; }
  .payment-box.pb-received .pb-head { color: #0f7a32; }
  .payment-box table.totals td { border-top: 1px solid #ddd; }
  table.totals .balance-due td { font-weight: 700; color: #c0141b; }
  table.totals tr.paid-ok td { font-weight: 700; color: #0f7a32; }
  .in-words { margin: 12px 0; font-weight: 700; }
  .in-words span { font-weight: 400; }
  .closing { margin-top: 10px; }
  .sign { margin-top: 22px; line-height: 1.5; }
  .sign .sigrow { display: flex; align-items: flex-end; gap: 20px; margin: 0 0 6px; }
  .sign .sig { display: inline-block; height: 150px; width: auto; max-width: 300px; max-height: 160px; object-fit: contain; object-position: left center; }
  .sign .stamp { display: inline-block; height: 170px; width: auto; max-width: 340px; max-height: 180px; object-fit: contain; object-position: left center; }
  .sign .for { margin-top: 16px; border-top: 1px solid #1c2333; padding-top: 4px; width: 260px; }
  .notes {
    margin-top: 12px;
    white-space: pre-wrap;
    background: #f0f2f7;
    border: 1px solid #e2e7f0;
    padding: 8px 10px;
    font-size: 11pt;
  }
  .spacer { flex: 1 1 auto; min-height: 26px; }
  .footer {
    margin-top: auto;
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
  .tb-btn-primary { background: #0f172a; }
  .tb-btn-primary:hover { background: #1e293b; }
  .tb-btn:hover { background: #a00f15; }
  .no-letterhead .letterhead { display: none; }
  .no-letterhead .footer { display: none; }
  @media print {
    @page { size: A4; margin: 12mm 14mm; }
    body { background: #fff; }
    .sheet { margin: 0; width: auto; min-height: calc(297mm - 24mm); box-shadow: none; padding: 0; }
    .toolbar { display: none; }
    .items, table.totals, .sign, .notes { page-break-inside: avoid; }
    table.items tr, .subject, .sec { page-break-after: avoid; }
  }
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
        <div class="q-title">BILL</div>
        <div class="q-no">${esc(bill.billNo)}</div>
        <div class="q-meta">Date: ${esc(bill.date)}</div>
        <div class="q-meta">BS ${esc(bsDate(bill.date))}</div>
        ${refs ? `<div class="q-meta">${refs}</div>` : ""}
      </div>
    </div>

    <div class="to-block">
      ${partyBlock("Billed to", billTo)}
    </div>

    <div class="subject">Subject: Bill ${esc(bill.billNo)} for ${esc(
    billTo.company || billTo.name
  )}</div>

    ${itemsTable(bill.items)}

    ${totalsTable(bill)}

    ${paymentBox(bill)}

    <div class="in-words">In words: <span>${esc(amountInWords(bill.total))}</span></div>

    ${notesBlock}

    <div class="body-text closing">
      Thank you for your business. Please contact us if you require any
      clarification regarding this bill.
    </div>

    <div class="sign">
      Billed by,<br><br>
      <div class="sigrow">
        ${
          billedBy.signature
            ? `<img class="sig" src="${billedBy.signature}" alt="">`
            : ""
        }
        ${
          billedBy.stamp
            ? `<img class="stamp" src="${billedBy.stamp}" alt="">`
            : ""
        }
      </div>
      ${esc(billedBy.name || "")}<br>
      ${billedBy.title ? `${esc(billedBy.title)}<br>` : ""}
      ${esc(contactLine)}
      <div class="for">For ${esc(company.name)}</div>
    </div>

    <div class="spacer"></div>
    <div class="footer">${esc(footerLine)}</div>
  </div>
</body>
</html>`;
}
