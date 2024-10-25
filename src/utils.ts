import { decode } from "light-bolt11-decoder";

type InvoiceData = {
  amount: string;
  paymentHash: string;
  memo?: string;
};

export function parseInvoice(invoice: string): InvoiceData {
  const sections = decode(invoice).sections;
  const invoiceData: InvoiceData = {} as InvoiceData;
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].name === "amount") {
      //@ts-expect-error value is defined
      invoiceData.amount = sections[i].value;
    }
    if (sections[i].name === "description") {
      //@ts-expect-error value is defined
      invoiceData.memo = sections[i].value;
    }
    if (sections[i].name === "payment_hash") {
      //@ts-expect-error value is defined
      invoiceData.paymentHash = sections[i].value;
    }
  }
  return invoiceData;
}
