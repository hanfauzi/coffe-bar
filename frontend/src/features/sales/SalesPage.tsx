import { useState } from 'react';
import { ShoppingBag, Trash2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { sales as salesApi } from './api';
import type { Sale } from './types';
import { formatRupiah, formatDate } from '../../utils/helpers';
import { Modal, ConfirmModal } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import type { Ingredient } from '../ingredients/types';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/table';

interface SalesPageProps {
  sales: Sale[];
  ingredients: Ingredient[];
  fetchData: () => void;
}

export default function SalesPage({
  sales,
  ingredients,
  fetchData,
}: SalesPageProps) {
  const { toast } = useToast();
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const handleDeleteSale = async (id: string) => {
    try {
      await salesApi.delete(id);
      toast.success('Penjualan berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Catatan Penjualan</h1>
          <p className="text-ink-secondary text-xs mt-1">Daftar transaksi penjualan riil kedai kopi Anda.</p>
        </div>
      </div>

      {/* Sales List Table */}
      {sales.length > 0 ? (
        <>
          {/* Mobile View (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {sales.map((sale) => {
              const itemsText = sale.items
                .filter((i) => !i.parentItemId)
                .map((i) => {
                  const itemExtras = sale.items.filter((e) => e.parentItemId === i.id);
                  const extrasText = itemExtras.length > 0 
                    ? ` (+ ${itemExtras.map(ex => `${ex.quantity}x ${ex.menu?.name || 'Extra'}`).join(', ')})`
                    : '';
                  const isSugarExcluded = i.excludedIngredients?.includes('163d85a1-18ee-4481-b8ad-0a93c038c8bd');
                  let sugarText = '';
                  if (isSugarExcluded) {
                    sugarText = ' (No Sugar)';
                  } else if (i.sugarLevel === 'LESS') {
                    sugarText = ' (Less Sugar)';
                  }
                  return `${Number(i.quantity)}x ${i.menu?.name || 'Item Kustom'}${sugarText}${extrasText}`;
                })
                .join(', ');
              return (
                <div key={sale.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-ink-muted font-mono">{formatDate(sale.date)}</p>
                    </div>
                    <span className="font-bold text-xs text-ink font-mono">{formatRupiah(sale.totalAmount)}</span>
                  </div>

                  <div 
                    onClick={() => setSelectedSale(sale)}
                    className="text-xs text-ink-secondary bg-surface-soft p-2.5 rounded-lg border border-border hover:border-ink cursor-pointer hover:bg-surface-soft/80 transition"
                  >
                    <span className="font-semibold text-ink">Item: </span>
                    {itemsText}
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono border-t border-border pt-2 text-ink-muted">
                    <div className="flex gap-3">
                      <div>
                        <span>HPP: </span>
                        <span className="text-error">-{formatRupiah(sale.totalHpp)}</span>
                      </div>
                      <div>
                        <span>Profit: </span>
                        <span className="text-success font-semibold">{formatRupiah(sale.grossProfit)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDeletingSaleId(sale.id)}
                      className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                      title="Hapus Penjualan"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto bg-surface border border-border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Item Penjualan</TableHead>
                  <TableHead align="right">Pendapatan</TableHead>
                  <TableHead align="right">Total HPP</TableHead>
                  <TableHead align="right">Gross Profit</TableHead>
                  <TableHead align="right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="whitespace-nowrap font-mono text-ink-muted">{formatDate(sale.date)}</TableCell>
                    <TableCell 
                      className="font-semibold text-ink cursor-pointer hover:underline hover:text-primary transition whitespace-nowrap max-w-xs truncate"
                      onClick={() => setSelectedSale(sale)}
                      title="Klik untuk melihat detail transaksi"
                    >
                      {sale.items
                        .filter((i) => !i.parentItemId)
                        .map((i) => {
                          const itemExtras = sale.items.filter((e) => e.parentItemId === i.id);
                          const extrasText = itemExtras.length > 0 
                            ? ` (+ ${itemExtras.map(ex => `${ex.quantity}x ${ex.menu?.name || 'Extra'}`).join(', ')})`
                            : '';
                          const isSugarExcluded = i.excludedIngredients?.includes('163d85a1-18ee-4481-b8ad-0a93c038c8bd');
                          let sugarText = '';
                          if (isSugarExcluded) {
                            sugarText = ' (No Sugar)';
                          } else if (i.sugarLevel === 'LESS') {
                            sugarText = ' (Less Sugar)';
                          }
                          return `${Number(i.quantity)}x ${i.menu?.name || 'Item Kustom'}${sugarText}${extrasText}`;
                        })
                        .join(', ')}
                    </TableCell>
                    <TableCell align="right" className="font-bold text-ink font-mono">{formatRupiah(sale.totalAmount)}</TableCell>
                    <TableCell align="right" className="text-error font-mono">-{formatRupiah(sale.totalHpp)}</TableCell>
                    <TableCell align="right" className="font-bold text-success font-mono">{formatRupiah(sale.grossProfit)}</TableCell>
                    <TableCell align="right">
                      <button 
                        onClick={() => setDeletingSaleId(sale.id)}
                        className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                        title="Hapus Penjualan"
                      >
                        <Trash2 size={13} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl text-center py-16 px-6 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-muted">
            <ShoppingBag size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">Belum Ada Catatan Penjualan</h3>
            <p className="text-xs text-ink-secondary">Gunakan halaman Pemesanan untuk membuat pesanan baru dan menyelesaikannya untuk menghasilkan penjualan.</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        title="Detail Transaksi Penjualan"
        description="Detail item, modifikasi resep, dan tambahan untuk penjualan ini."
        maxWidth="lg"
      >
        {selectedSale && (
          <div className="space-y-4 text-ink">
            <div className="flex justify-between text-xs border-b border-border pb-2 text-ink-secondary">
              <span>Tanggal: {formatDate(selectedSale.date)}</span>
              <span className="font-mono">ID: {selectedSale.id.slice(0, 8)}</span>
            </div>
            
            <div className="space-y-3">
              {selectedSale.items
                .filter(item => !item.parentItemId)
                .map((item, index) => {
                  const itemExtras = selectedSale.items.filter(e => e.parentItemId === item.id);
                  
                  const excludedNames = item.excludedIngredients
                    ? item.excludedIngredients.map(id => {
                        const ing = ingredients.find(i => i.id === id);
                        return ing ? ing.name : id;
                      })
                    : [];
                  
                  const isSugarExcluded = item.excludedIngredients?.includes('163d85a1-18ee-4481-b8ad-0a93c038c8bd');
                  let sugarLabel = 'Normal Sugar';
                  if (isSugarExcluded) {
                    sugarLabel = 'No Sugar';
                  } else if (item.sugarLevel === 'LESS') {
                    sugarLabel = 'Less Sugar';
                  }

                  return (
                    <div key={item.id || index} className="p-3 bg-surface-soft rounded-lg border border-border space-y-1.5">
                      <div className="flex justify-between font-semibold">
                        <span>{Number(item.quantity)}x {item.menu?.name || 'Item Kustom'}</span>
                        <span className="font-mono text-xs">{formatRupiah(Number(item.finalPrice))}</span>
                      </div>
                      
                      <div className="text-xs space-y-1 text-ink-secondary pl-2 border-l-2 border-border">
                        <div>Sugar Level: <span className="font-semibold text-ink">{sugarLabel}</span></div>
                        
                        {excludedNames.filter(name => !name.toLowerCase().includes('gula')).length > 0 && (
                          <div>
                            Dikecualikan: <span className="text-error font-medium">{excludedNames.filter(name => !name.toLowerCase().includes('gula')).join(', ')}</span>
                          </div>
                        )}
                        
                        {itemExtras.length > 0 && (
                          <div className="mt-1">
                            Extras: <span className="text-primary font-medium">{itemExtras.map(ex => `${Number(ex.quantity)}x ${ex.menu?.name || 'Extra'}`).join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {selectedSale.notes && (
              <div className="bg-surface border border-border p-3 rounded-lg text-xs">
                <span className="font-bold block mb-1">Catatan:</span>
                <ul className="list-disc pl-4 space-y-1 text-ink-secondary italic font-medium">
                  {selectedSale.notes.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border-t border-border pt-3 flex justify-between items-center text-xs">
              <span className="font-semibold text-ink-secondary">Total HPP: <span className="text-error font-mono">-{formatRupiah(selectedSale.totalHpp)}</span></span>
              <span className="font-bold text-sm">Total Pendapatan: <span className="text-success font-mono">{formatRupiah(selectedSale.totalAmount)}</span></span>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setSelectedSale(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deletingSaleId}
        onClose={() => setDeletingSaleId(null)}
        onConfirm={() => {
          if (deletingSaleId) {
            handleDeleteSale(deletingSaleId);
          }
        }}
        title="Hapus Penjualan"
        description="Apakah Anda yakin ingin menghapus penjualan ini? Stok bahan baku akan direstorasi."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
