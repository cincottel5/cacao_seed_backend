import type { ISODate, UUID } from './shared.js';

export interface Period {
  id: UUID;
  userId: UUID;
  startDate: ISODate;
  endDate: ISODate | null;
}

export interface PeriodPage {
  items: Period[];
  page: number;
  pageSize: number;
  total: number;
}