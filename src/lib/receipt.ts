import {
  amountInWords,
  bsDate,
  esc,
  money,
  type SiteContact,
} from "./quotation";
import type { PaymentMethod } from "./payment";

export interface ReceiptData {
  receiptNo: string;
  receiptAt: string;
  orderNo?: string;
  quoteNo?: string;
  billNo?: string;
  customer: { name: string; company?: string; email?: string; address?: string; phone?: string };
  total: number;
  paid: number;
  balance: number;
  method?: PaymentMethod;
  ref?: string;
  note?: string;
}

export interface ReceiptParty {
  name: string;
  email?: string;
  title?: string;
  signature?: string;
  stamp?: string;
}

interface ReceiptRenderOptions {
  origin: string;
  company: SiteContact;
  receipt: ReceiptData;
  receivedBy: ReceiptParty;
  logoSrc?: string;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank: "Bank Transfer",
  cash: "Cash",
  online: "Online Payment",
  transfer: "Offline Transfer",
};

export function paymentMethodLabel(method?: PaymentMethod): string {
  return method ? METHOD_LABELS[method] : "—";
}

export function renderReceiptHtml(opts: ReceiptRenderOptions): string {
  const { origin, company, receipt, receivedBy } = opts;
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

  const dateIso = receipt.receiptAt.slice(0, 10);
  const notesBlock = receipt.note
    ? `<div class="notes"><strong>Notes:</strong><br>${esc(receipt.note)}</div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt ${esc(receipt.receiptNo)} — ${esc(company.name)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { font-family: "Segoe UI", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif; color: #2c303c; background: #e2e8f0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .sheet { width: 210mm; max-width: none; min-height: 297mm; padding: 10mm 14mm 14mm; margin: 16px auto; box-shadow: 0 4px 24px rgba(15,23,42,.15); background: #fff; position: relative; font-size: 12.5pt; line-height: 1.5; }
  .letterhead { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; padding: 4px 0 10px; border-bottom: 2px solid #e2e7f0; }
  .lh-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .lh-left .logo { height: 52px; width: auto; }
  .lh-left .nm { font-size: 14pt; font-weight: 700; color: #c0141b; }
  .lh-left .tag { font-size: 12.5pt; color: #2c303c; margin-top: 1px; }
  .lh-right { text-align: right; flex-shrink: 0; }
  .lh-right .q-title { font-size: 24pt; font-weight: 700; color: #15983d; letter-spacing: .12em; line-height: 1.1; }
  .lh-right .q-no { font-size: 12.5pt; font-weight: 700; color: #1c2333; margin-top: 3px; }
  .lh-right .q-meta { font-size: 12.5pt; color: #1c2333; margin-top: 1px; }
  .to-block { margin-top: 16px; }
  .party-title { font-weight: 700; }
  .subject { font-weight: 700; color: #1c2333; margin: 12px 0 4px; }
  table.summary { width: 100%; border-collapse: collapse; font-size: 12.5pt; margin-top: 10px; }
  table.summary td { border: 1px solid #999999; padding: 8px 10px; }
  table.summary td.k { background: #e2e7f0; font-weight: 700; width: 48%; }
  table.totals { width: 100%; border-collapse: collapse; font-size: 12.5pt; margin-top: 14px; }
  table.totals td { border: 0; border-top: 1px solid #999999; padding: 6px 8px; }
  table.totals .tot-label { width: 70%; padding-left: 0; }
  table.totals .r { text-align: right; white-space: nowrap; }
  table.totals tr.gt td { font-weight: 700; border-top: 2px solid #1c2333; }
  table.totals .paid td { font-weight: 700; color: #15983d; }
  table.totals .bal td { font-weight: 700; color: #c0141b; }
  .in-words { margin: 12px 0; font-weight: 700; }
  .in-words span { font-weight: 400; }
  .closing { margin-top: 10px; }
  .sign { margin-top: 22px; line-height: 1.5; }
  .sign .sigrow { display: flex; align-items: flex-end; gap: 20px; margin: 0 0 6px; }
  .sign .sig { display: inline-block; height: 120px; width: auto; max-width: 220px; max-height: 130px; object-fit: contain; object-position: left center; }
  .sign .stamp { display: inline-block; height: 132px; width: auto; max-width: 260px; max-height: 142px; object-fit: contain; object-position: left center; }
  .sign .for { margin-top: 16px; border-top: 1px solid #1c2333; padding-top: 4px; width: 260px; }
  .notes { margin-top: 12px; white-space: pre-wrap; background: #f0f2f7; border: 1px solid #e2e7f0; padding: 8px 10px; font-size: 11pt; }
  .footer { margin-top: 26px; border-top: 1px solid #e5e7eb; padding-top: 8px; font-size: 9.5pt; color: #6b7280; text-align: center; }
  @media print { @page { size: A4; margin: 12mm 14mm; } body { background: #fff; } .sheet { margin: 0; width: auto; min-height: auto; box-shadow: none; padding: 0; } .items, table.totals, .sign, .notes { page-break-inside: avoid; } }
</style>
</head>
<body>
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
        <div class="q-title">RECEIPT</div>
        <div class="q-no">${esc(receipt.receiptNo)}</div>
        <div class="q-meta">Date: ${esc(dateIso)}</div>
        <div class="q-meta">BS ${esc(bsDate(dateIso))}</div>
        ${receipt.billNo ? `<div class="q-meta">Bill: ${esc(receipt.billNo)}</div>` : ""}
      </div>
    </div>

    <div class="to-block">
      <div class="party-title">Received from</div>
      <div>${esc(receipt.customer.name)}${receipt.customer.company ? `<br>${esc(receipt.customer.company)}` : ""}${receipt.customer.address ? `<br>${esc(receipt.customer.address)}` : ""}${receipt.customer.phone ? `<br>${esc(receipt.customer.phone)}` : ""}</div>
    </div>

    <div class="subject">Subject: Payment received ${receipt.billNo ? `on Bill ${esc(receipt.billNo)}` : ""} — ${esc(receipt.receiptNo)}</div>

    <table class="summary">
      <tbody>
        <tr><td class="k">Order No</td><td>${esc(receipt.orderNo ?? "—")}</td><td class="k">Quote No</td><td>${esc(receipt.quoteNo ?? "—")}</td></tr>
        <tr><td class="k">Receipt No</td><td>${esc(receipt.receiptNo)}</td><td class="k">Payment Date</td><td>${esc(dateIso)}</td></tr>
        <tr><td class="k">Payment Method</td><td>${esc(paymentMethodLabel(receipt.method))}</td><td class="k">Reference</td><td>${esc(receipt.ref ?? "—")}</td></tr>
      </tbody>
    </table>

    <table class="totals">
      <tbody>
        <tr><td class="tot-label">Bill Amount</td><td class="r">${money(receipt.total)}</td></tr>
        <tr class="paid"><td class="tot-label">Amount Received</td><td class="r">${money(receipt.paid)}</td></tr>
        <tr class="bal"><td class="tot-label">Balance Due</td><td class="r">${money(receipt.balance)}</td></tr>
      </tbody>
    </table>

    <div class="in-words">In words: <span>${esc(amountInWords(receipt.paid))}</span></div>

    ${notesBlock}

    <div class="body-text closing">
      Thank you for your payment. This receipt acknowledges receipt of the funds
      specified above.
    </div>

    <div class="sign">
      Received by,<br><br>
      <div class="sigrow">
        ${receivedBy.signature ? `<img class="sig" src="${receivedBy.signature}" alt="">` : ""}
        ${receivedBy.stamp ? `<img class="stamp" src="${receivedBy.stamp}" alt="">` : ""}
      </div>
      ${esc(receivedBy.name || "")}<br>
      ${receivedBy.title ? `${esc(receivedBy.title)}<br>` : ""}
      ${esc(contactLine)}
      <div class="for">For ${esc(company.name)}</div>
    </div>

    <div class="footer">${esc(footerLine)}</div>
  </div>
</body>
</html>`;
}