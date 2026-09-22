import test from 'node:test';
import assert from 'node:assert/strict';

const toCents = (amount: string) => {
  const [whole, fraction = '00'] = amount.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2));
};

void test('money values can be converted to cents without floating-point drift', () => {
  const a = '10.20';
  const b = '5.80';

  assert.equal(toCents(a) + toCents(b), 1600);
  assert.equal((toCents(a) - toCents(b)) / 100, 4.4);
});
