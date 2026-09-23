export type BudgetRole = 'admin' | 'member' | 'viewer';

export const canView = (role: BudgetRole | null): boolean => role !== null;
export const canWrite = (role: BudgetRole | null): boolean => role === 'admin' || role === 'member';
export const canManageMembers = (role: BudgetRole | null): boolean => role === 'admin';
export const canDeleteBudget = (role: BudgetRole | null): boolean => role === 'admin';

export const canRemoveMember = (remainingMemberCount: number): boolean => remainingMemberCount > 0;