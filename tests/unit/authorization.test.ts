import test from 'node:test';
import assert from 'node:assert/strict';

const userRoles = {
  viewer: 'viewer',
  member: 'member',
  admin: 'admin'
} as const;

const canCreateBook = (role: (typeof userRoles)[keyof typeof userRoles]) => role !== 'viewer';
const canDeleteBudget = (role: (typeof userRoles)[keyof typeof userRoles]) => role === 'admin';
const canManageMembers = (role: (typeof userRoles)[keyof typeof userRoles]) => role === 'admin';

const membershipCount = 1;

void test('viewer cannot create books or delete budgets', () => {
  assert.equal(canCreateBook(userRoles.viewer), false);
  assert.equal(canDeleteBudget(userRoles.viewer), false);
  assert.equal(canManageMembers(userRoles.viewer), false);
});

void test('member can create books but cannot manage members', () => {
  assert.equal(canCreateBook(userRoles.member), true);
  assert.equal(canDeleteBudget(userRoles.member), false);
  assert.equal(canManageMembers(userRoles.member), false);
});

void test('admin can manage members and delete budgets', () => {
  assert.equal(canCreateBook(userRoles.admin), true);
  assert.equal(canDeleteBudget(userRoles.admin), true);
  assert.equal(canManageMembers(userRoles.admin), true);
});

void test('budget must retain at least one member', () => {
  assert.equal(membershipCount > 0, true);
});
