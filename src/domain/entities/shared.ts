export type UUID = string & { readonly __brand: 'UUID' };
export type ISODate = string & { readonly __brand: 'ISODate' };
export type Currency = 'crc' | 'usd';
export type DecimalString = string & { readonly __brand: 'DecimalString' };

export const currencies = ['crc', 'usd'] as const;

export const isDecimalString = (value: string): value is DecimalString =>
  /^\d+(\.\d{1,2})?$/.test(value);