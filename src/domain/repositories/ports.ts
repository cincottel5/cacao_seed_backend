import type { User, UserSettings } from '../entities/user.js';
import type { UUID } from '../entities/shared.js';
import type { Period, PeriodPage } from '../entities/period.js';

export interface UserRepository {
  findById(id: UUID): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export interface UserSettingsRepository {
  findByUserId(userId: UUID): Promise<UserSettings | null>;
  save(settings: UserSettings): Promise<UserSettings>;
}

export interface PeriodRepository {
  findCurrent(userId: UUID): Promise<Period | null>;
  list(userId: UUID, options: { page: number; pageSize: number; from?: string; to?: string }): Promise<PeriodPage>;
  create(period: Period): Promise<Period>;
  close(id: UUID, endDate: string): Promise<Period>;
}

export interface BudgetRepository {
  findById(id: UUID): Promise<Record<string, unknown> | null>;
}

export interface MembershipRepository {
  findRole(userId: UUID, budgetId: UUID): Promise<'admin' | 'member' | 'viewer' | null>;
}

export interface BookRepository { findById(id: number): Promise<Record<string, unknown> | null>; }
export interface TransactionRepository { findById(id: UUID): Promise<Record<string, unknown> | null>; }
export interface ExpenseOccurrenceRepository { findById(id: UUID): Promise<Record<string, unknown> | null>; }
export interface SchedulingRepository { findByBookId(bookId: number): Promise<Record<string, unknown> | null>; }

export type RepositoryPorts = {
  users: UserRepository;
  settings: UserSettingsRepository;
  periods: PeriodRepository;
  budgets: BudgetRepository;
  memberships: MembershipRepository;
  books: BookRepository;
  transactions: TransactionRepository;
  occurrences: ExpenseOccurrenceRepository;
  schedules: SchedulingRepository;
};