/**
 * Склонение существительных по числам.
 * @example pluralRu(3, ['кейс', 'кейса', 'кейсов']) → 'кейса'
 */
export function pluralRu(n, forms) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;

  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5)  return forms[1];
  if (last === 1)            return forms[0];
  return forms[2];
}

/** 15000 → «15 000 ₽» */
export function formatPrice(value, currency = '₽') {
  if (value == null || value === '') return null;

  const num = Number(value);
  if (!Number.isFinite(num)) return String(value);

  return `${num.toLocaleString('ru-RU')} ${currency}`;
}
