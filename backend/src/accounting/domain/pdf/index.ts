import { BankAdapter } from './types';
import { sicrediAdapter } from './sicredi.adapter';
import { bbAdapter } from './bb.adapter';
import { banrisulAdapter } from './banrisul.adapter';
import { pagbankAdapter } from './pagbank.adapter';
import { genericAdapter } from './generic.adapter';

// 🆕 NOVO BANCO (C6, Nubank, Caixa...)? Crie `x.adapter.ts` e adicione 1 linha aqui.
// A UI lista os bancos sozinha via GET /accounting/pdf-adapters.
export const BANK_ADAPTERS: BankAdapter[] = [
  sicrediAdapter,
  bbAdapter,
  banrisulAdapter,
  pagbankAdapter,
];

export const GENERIC_ADAPTER = genericAdapter;

export function resolveAdapter(text: string, forcedId?: string): BankAdapter {
  if (forcedId && forcedId !== 'auto') {
    const a = BANK_ADAPTERS.find((x) => x.id === forcedId);
    if (a) return a;
  }
  return BANK_ADAPTERS.find((a) => a.detect(text)) ?? GENERIC_ADAPTER;
}