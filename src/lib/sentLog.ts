export type SentLogEntry =
  | {
      type: "quote";
      id: string;
      quoteNo?: string;
      subject: string;
      total?: number;
      to: string;
      sentBy: string;
      sentAt: string;
      status: "sent" | "failed";
      customerId: string;
      customerName: string;
      customerEmail: string;
    }
  | {
      type: "suchidarta";
      id: string;
      recipient: string;
      sentTo: string;
      sentBy: string;
      sentAt: string;
      status: "sent" | "failed";
      customerId: string;
      customerName: string;
      customerEmail: string;
    }
  | {
      type: "bill";
      id: string;
      billNo: string;
      orderNo?: string;
      subject: string;
      total?: number;
      billedBy: string;
      billedAt: string;
      status: "issued" | "failed";
      customerId: string;
      customerName: string;
      customerEmail: string;
    };