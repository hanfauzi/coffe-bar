import { History } from 'lucide-react';
import { useState } from 'react';
import { Select } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import type { InventoryTransaction } from './types';
import { formatDateTime, formatRupiah, translateTxType } from '../../utils/helpers';

interface InventoryPageProps {
  transactions: InventoryTransaction[];
}

export default function InventoryPage({
  transactions,
}: InventoryPageProps) {
  const [filterType, setFilterType] = useState<string>('ALL');

  const formatReferenceType = (ref: string) => {
    switch (ref) {
      case 'SALE': return 'Penjualan';
      case 'EXPENSE': return 'Belanja';
      case 'PERSONAL_CUP': return 'Konsumsi Pribadi';
      case 'MANUAL': return 'Manual';
      case 'ADJUSTMENT': return 'Penyesuaian';
      default: return ref.replace(/_/g, ' ');
    }
  };

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'RAW_MATERIAL': return 'Bahan Baku';
      case 'PACKAGING': return 'Kemasan';
      case 'OTHER': return 'Lainnya';
      default: return cat.replace(/_/g, ' ');
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'ALL') return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Ledger Mutasi Inventory</h1>
          <p className="text-ink-secondary text-xs mt-1">Histori mutasi stok bahan baku secara real-time (dari penjualan, belanja, atau penyesuaian manual).</p>
        </div>
        <div className="w-56 shrink-0">
          <Select
            label="Filter Tipe Mutasi"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Semua Tipe Mutasi</option>
            <option value="PURCHASE">Belanja Bahan Baku (Purchase)</option>
            <option value="SALE_USAGE">Penggunaan Penjualan (Sale)</option>
            <option value="PERSONAL_USAGE">Konsumsi Pribadi</option>
            <option value="MANUAL_ADJUSTMENT">Penyesuaian Manual</option>
            <option value="WASTE">Bahan Terbuang (Waste)</option>
            <option value="CORRECTION">Koreksi (Correction)</option>
          </Select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length > 0 ? (
        <>
          {/* Mobile View (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-xs text-ink">{tx.ingredient?.name}</p>
                    <p className="text-[10px] text-ink-muted font-mono mt-0.5">{formatDateTime(tx.createdAt || tx.date)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium whitespace-nowrap ${
                    tx.type === 'PURCHASE' ? 'bg-success/10 border-success/20 text-success' :
                    tx.type === 'SALE_USAGE' ? 'bg-link/10 border-link/20 text-link' :
                    tx.type === 'PERSONAL_USAGE' ? 'bg-focus/10 border-focus/20 text-focus' :
                    'bg-surface-soft border-border text-ink-muted'
                  }`}>
                    {translateTxType(tx.type)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono bg-surface-soft p-2 rounded-lg border border-border">
                  <div>
                    <p className="text-[9px] text-ink-muted uppercase">Kategori</p>
                    <p className="font-semibold text-ink-secondary truncate">{translateCategory(tx.ingredient?.category || '')}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-ink-muted uppercase">Mutasi</p>
                    <p className={`font-bold ${Number(tx.quantityChange) > 0 ? 'text-success' : 'text-error'}`}>
                      {Number(tx.quantityChange) > 0 ? `+${tx.quantityChange}` : tx.quantityChange} {tx.ingredient?.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-ink-muted uppercase">HPP Unit</p>
                    <p className="text-ink truncate">{formatRupiah(tx.unitCostSnapshot || 0)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-border pt-2 text-ink-muted">
                  <span>Ref: {formatReferenceType(tx.referenceType || '')}</span>
                  <span className="truncate max-w-[150px]">{tx.notes || '-'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto bg-surface border border-border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Bahan Baku</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Tipe Mutasi</TableHead>
                  <TableHead align="right">Kuantitas</TableHead>
                  <TableHead align="right">Snapshot HPP Unit</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap font-mono text-ink-muted">{formatDateTime(tx.createdAt || tx.date)}</TableCell>
                    <TableCell className="font-semibold text-ink whitespace-nowrap">{tx.ingredient?.name}</TableCell>
                    <TableCell className="text-xs text-ink-secondary font-medium whitespace-nowrap">{translateCategory(tx.ingredient?.category || '')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium whitespace-nowrap ${
                        tx.type === 'PURCHASE' ? 'bg-success/10 border-success/20 text-success' :
                        tx.type === 'SALE_USAGE' ? 'bg-link/10 border-link/20 text-link' :
                        tx.type === 'PERSONAL_USAGE' ? 'bg-focus/10 border-focus/20 text-focus' :
                        'bg-surface-soft border-border text-ink-muted'
                      }`}>
                        {translateTxType(tx.type)}
                      </span>
                    </TableCell>
                    <TableCell align="right" className={`font-bold font-mono whitespace-nowrap ${Number(tx.quantityChange) > 0 ? 'text-success' : 'text-error'}`}>
                      {Number(tx.quantityChange) > 0 ? `+${tx.quantityChange}` : tx.quantityChange} {tx.ingredient?.unit}
                    </TableCell>
                    <TableCell align="right" className="p-4 text-right font-mono text-ink whitespace-nowrap">{formatRupiah(tx.unitCostSnapshot || 0)}</TableCell>
                    <TableCell className="text-ink-muted font-mono text-[10px] whitespace-nowrap">
                      {formatReferenceType(tx.referenceType || '')} <span className="opacity-60">({tx.referenceId ? tx.referenceId.slice(0, 8) : '-'})</span>
                    </TableCell>
                    <TableCell className="text-ink-muted truncate max-w-xs">{tx.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl text-center py-16 px-6 space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-muted">
            <History size={20} />
          </div>
          <h3 className="text-sm font-semibold text-ink">Tidak Ada Mutasi Ditemukan</h3>
          <p className="text-xs text-ink-secondary">
            {filterType === 'ALL' 
              ? 'Semua mutasi stok otomatis tercatat saat Anda melakukan transaksi.' 
              : 'Tidak ada histori mutasi untuk filter tipe mutasi yang dipilih.'}
          </p>
        </div>
      )}
    </div>
  );
}
