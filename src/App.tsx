import { useEffect, useMemo, useRef, useState } from "react";
import { parseInvoice } from "./utils";
import {
  CashuMint,
  CashuWallet,
  getDecodedToken,
  MeltQuoteResponse,
  MintQuoteResponse,
  Proof,
} from "@cashu/cashu-ts";

const mint = new CashuMint("https://mint.mintbits.cash/Bitcoin");
const wallet = new CashuWallet(mint);

function App() {
  const [targetInvoice, setTargetInvoice] = useState("");
  const [targetAmount, setTargetAmount] = useState(0);
  const [quote, setQuote] = useState<MeltQuoteResponse>();
  const [proofMap, setProofMap] = useState<{ [secret: string]: Proof }>({});
  const [sending, setSending] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const collectedAmount = useMemo(() => {
    return Object.keys(proofMap).reduce((a, c) => a + proofMap[c].amount, 0);
  }, [proofMap]);
  const missingAmount = useMemo(() => {
    return targetAmount - collectedAmount;
  }, [collectedAmount, targetAmount]);
  const invoiceRef = useRef<HTMLInputElement>(null);
  const cashuRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function attemptPayInvoice() {
      setSending(true);
      if (!quote) {
        return;
      }
      const allProofs = Object.keys(proofMap).map((secret) => proofMap[secret]);
      const res = await wallet.meltTokens(quote, allProofs);
      console.log(res);
      setSending(false);
      setIsPaid(true);
    }
    if (missingAmount < 0) {
      attemptPayInvoice();
    }
  }, [missingAmount, quote, proofMap]);

  async function handleParse() {
    if (!invoiceRef.current?.value) {
      return;
    }
    const parsed = parseInvoice(invoiceRef.current.value);
    const invoiceAmount = Number(parsed.amount) / 1000;
    const quote = await wallet.createMeltQuote(invoiceRef.current.value);
    setQuote(quote);
    setTargetInvoice(invoiceRef.current.value);
    setTargetAmount(invoiceAmount + quote.fee_reserve);
  }

  async function handleAdd() {
    if (!cashuRef.current?.value) {
      return;
    }
    const decoded = getDecodedToken(cashuRef.current.value);
    setProofMap((p) => {
      const newMap = { ...p };
      decoded.token[0].proofs.forEach((proof) => {
        newMap[proof.secret] = proof;
      });
      return newMap;
    });
  }
  return (
    <main className="absolute inset-0 flex justify-center items-center">
      <input ref={invoiceRef} />
      <button onClick={handleParse}>Parse</button>
      {targetAmount ? (
        <p>Missing {targetAmount - collectedAmount} SATS</p>
      ) : undefined}
      {targetAmount ? (
        <div>
          <input ref={cashuRef} />
          <button onClick={handleAdd}>Add Token</button>
        </div>
      ) : undefined}
      {sending ? <p>Sending payment...</p> : undefined}
      {isPaid ? <p>Invoice was paid</p> : undefined}
    </main>
  );
}

export default App;
