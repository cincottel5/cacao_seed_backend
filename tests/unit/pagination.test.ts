import test from 'node:test';
import assert from 'node:assert/strict';

const normalizePagination = (page: number, pageSize: number) => {
  const safePage = Number.isFinite(page) && page > 0 ? page : 1;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20;
  return {
    page: safePage,
    pageSize: Math.min(safePageSize, 100)
  };
};

void test('pagination defaults and clamps to the maximum request size', () => {
  assert.deepEqual(normalizePagination(0, 0), { page: 1, pageSize: 20 });
  assert.deepEqual(normalizePagination(2, 400), { page: 2, pageSize: 100 });
  assert.deepEqual(normalizePagination(5, 18), { page: 5, pageSize: 18 });
});
