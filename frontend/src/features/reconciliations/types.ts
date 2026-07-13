export interface CashReconciliation {
  id: string;
  date: string;
  account: string;
  systemBalance: number;
  actualBalance: number;
  difference: number;
  reason: string;
  notes?: string | null;
  adjustTransactionId?: string | null;
  createdAt: string;
}
