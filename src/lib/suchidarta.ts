import { bsDateNepali, esc, nepaliDigits } from "@/lib/quotation";

export const SUCHIDARTA_SUBJECT =
  "विषय: सूचना व्यवस्थापन प्रणाली, उपकरण तथा आइ.सी.टी. हार्डवेयर जडान एवं वितरण कार्यको लागि कम्पनी सूचिकृत गरिपाउन सम्बन्धमा।";

export interface SuchidartaData {
  recipient: string;
  subject?: string;
  body: string;
  signatory: string;
  designation?: string;
  signatureSrc?: string;
  stampSrc?: string;
  companyName: string;
  contactLine: string;
  tagline?: string;
  date?: string;
}

export function defaultSuchidartaBody(): string {
  return `उपरोक्त विषयमा यस कार्यालयका लागि आवश्यक सूचना व्यवस्थापन प्रणाली (Information Management System), सोसँग सम्बन्धित उपकरणहरू तथा सम्पूर्ण आइ.सी.टी. हार्डवेयर (ICT Hardware) हरूको आपूर्ति, जडान तथा वितरण कार्यका लागि हाम्रो कम्पनीलाई सूचिकृत गरिदिनुहुन यो निवेदन पेश गरेका छौँ।

हाम्रो कम्पनी दर्ता प्रमाणपत्र, कर चुक्ता प्रमाणपत्र तथा स्थायी लेखा नम्बर (PAN/VAT) दर्ता प्रमाणपत्र लगायतका आवश्यक सम्पूर्ण कानुनी कागजातहरू यसै निवेदनसाथ संलग्न राखिएको व्यहोरा अनुरोध गर्दछौँ।`;
}

export function letterContactLine(phones: string[]): string {
  return phones.map((p) => nepaliDigits(p)).filter(Boolean).join(" | ");
}

interface RenderOptions {
  origin: string;
  data: SuchidartaData;
  letterhead: boolean;
  showToolbar?: boolean;
  variant?: "print" | "email";
  logoSrc?: string;
}

export function renderSuchidartaHtml(opts: RenderOptions): string {
  const { origin, data } = opts;
  const variant = opts.variant === "email" ? "email" : "print";
  const isPrint = variant === "print";
  const showToolbar = isPrint && (opts.showToolbar ?? true);
  const noLetterhead = isPrint && !opts.letterhead ? " no-letterhead" : "";
  const logoSrc = opts.logoSrc || `${origin}/images/logo.png`;
  const tagline = data.tagline || "";
  const subject = data.subject?.trim() || SUCHIDARTA_SUBJECT;

  const recipientHtml = data.recipient
    .split(/\r?\n/)
    .map(esc)
    .join("<br>");
  const bodyHtml = data.body
    .split(/\n\s*\n/)
    .map((para) => para.split(/\r?\n/).map(esc).join("<br>"))
    .filter((para) => para)
    .map((para) => `<p>${para}</p>`)
    .join("");

  const toolbar = showToolbar
    ? `
      <div class="toolbar">
        <strong style="font-size:13px">सुची दर्ता निवेदन</strong>
        <span style="flex:1"></span>
        <button class="tb-btn" onclick="document.body.classList.remove('no-letterhead');window.print()">Print with letterhead</button>
        <button class="tb-btn" onclick="document.body.classList.add('no-letterhead');window.print()">Print without letterhead</button>
      </div>`
    : "";

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>सुची दर्ता निवेदन — ${esc(data.companyName)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: "Mangal", "Noto Sans Devanagari", "Devanagari Sangam MN", "Hind", "Lohit Devanagari", sans-serif;
    color: #000;
    background: ${isPrint ? "#e2e8f0" : "#f4f5f7"};
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    width: ${isPrint ? "210mm" : "100%"};
    max-width: ${isPrint ? "none" : "720px"};
    ${isPrint
      ? "display: flex; flex-direction: column; min-height: 297mm; margin: 16px auto; box-shadow: 0 4px 24px rgba(15,23,42,.15); background: #fff;"
      : "margin: 24px auto; padding: 24px 30px; box-shadow: 0 1px 3px rgba(15,23,42,.08); background: #fff;"}
    position: relative;
  }
  .letterhead {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: ${isPrint ? "10pt 25mm 8px" : "4px 0 10px"};
    border-bottom: 2px solid #f06020;
  }
  .lh-left { display: flex; align-items: center; gap: 14px; min-width: 0; }
  .lh-left .logo { height: 52px; width: auto; }
  .lh-left .tag { font-size: 12.5pt; color: #2c303c; margin-top: 1px; }
  .content {
    padding: ${isPrint ? "0 25mm 12mm" : "16px 0 0"};
    flex: 1;
    font-size: ${isPrint ? "13.5pt" : "16pt"};
    line-height: ${isPrint ? "1.5" : "1.7"};
  }
  .date {
    text-align: right;
    margin-top: ${isPrint ? "5mm" : "8mm"};
  }
  .shree {
    margin-top: ${isPrint ? "6mm" : "10mm"};
  }
  .recipient {
    margin-top: 1mm;
  }
  .subject {
    margin-top: ${isPrint ? "6mm" : "10mm"};
  }
  .mahodaya {
    margin-top: ${isPrint ? "6mm" : "10mm"};
  }
  .body {
    margin-top: 1mm;
    text-align: justify;
    text-justify: inter-ideograph;
    white-space: normal;
    line-height: 1.3;
  }
  .body p { margin: 0 0 0.35em; }
  .body p:last-child { margin-bottom: 0; }
  .company-line {
    margin-top: ${isPrint ? "9mm" : "14mm"};
  }
  .sign {
    margin-top: ${isPrint ? "9mm" : "12mm"};
    line-height: 1.6;
  }
  .sign .close { margin-bottom: 5mm; }
  .sign .field { display: flex; align-items: center; gap: 8px; margin-top: 2mm; }
  .sign .lbl { font-weight: 700; white-space: nowrap; }
  .sign .blank {
    flex: 1;
    height: 1em;
    border-bottom: 1px dotted #000;
  }
  .sign .auto { font-weight: 700; }
  .sign .sigrow { display: flex; align-items: flex-end; gap: 20px; }
  .sign .sig { display: inline-block; height: 150px; width: auto; max-width: 300px; max-height: 160px; object-fit: contain; object-position: left center; }
  .sign .stamp { display: inline-block; height: 170px; width: auto; max-width: 340px; max-height: 180px; object-fit: contain; object-position: left center; }
  .contact {
    margin-top: 0;
  }
  .footer {
    margin-top: 26px;
    border-top: 2px solid #f06020;
    padding-top: 8px;
    font-size: 9.5pt;
    color: #6b7280;
    text-align: center;
  }
  .no-letterhead .letterhead { display: none; }
  .no-letterhead .footer { display: none; }
  .no-letterhead .content { padding-top: 15pt; }
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
  ${isPrint ? `@media print {
    @page { size: A4; margin: 0; }
    body { background: #fff; }
    .sheet { margin: 0; width: auto; min-height: 297mm; box-shadow: none; }
    .toolbar { display: none; }
    .letterhead, .sign, .contact { page-break-inside: avoid; }
    .body, .recipient, .subject { page-break-inside: avoid; }
  }` : ""}
</style>
</head>
<body class="${noLetterhead.trim() || "with-letterhead"}">
  ${toolbar}
  <div class="sheet">
    <div class="letterhead">
      <div class="lh-left">
        <img class="logo" src="${logoSrc}" alt="${esc(data.companyName)}">
        ${tagline ? `<div class="tag">${esc(tagline)}</div>` : ""}
      </div>
    </div>
    <div class="content">
      <div class="date">मिति:${esc(data.date?.trim() || bsDateNepali())}</div>
      <div class="shree">श्री,</div>
      <div class="recipient">${recipientHtml}</div>
      <div class="subject">${esc(subject)}</div>
      <div class="mahodaya">महोदय,</div>
      <div class="body">${bodyHtml}</div>
      <div class="sign">
        <div class="close">भवदीय,</div>
        <div class="field"><span class="lbl">दस्तखत:</span><div class="sigrow">${
          data.signatureSrc
            ? `<img class="sig" src="${data.signatureSrc}" alt="">`
            : ""
        }${
          data.stampSrc
            ? `<img class="stamp" src="${data.stampSrc}" alt="">`
            : ""
        }${
          !data.signatureSrc && !data.stampSrc
            ? '<span class="blank"></span>'
            : ""
        }</div></div>
        <div class="field"><span class="lbl">नाम:</span><span class="auto">${esc(data.signatory)}</span></div>
        <div class="field"><span class="lbl">पद:</span>${
          data.designation
            ? `<span class="auto">${esc(data.designation)}</span>`
            : '<span class="blank"></span>'
        }</div>
        <div class="field"><span class="lbl">कम्पनीको नाम:</span><span class="auto">${esc(data.companyName)}</span></div>
      </div>
      <div class="contact">सम्पर्क: ${esc(data.contactLine)}</div>
    </div>
    <div class="footer">${esc(
      [data.companyName, data.tagline || data.contactLine]
        .filter(Boolean)
        .join(" · ")
    )}</div>
  </div>
</body>
</html>`;
}
