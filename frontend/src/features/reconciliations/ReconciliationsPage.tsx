import { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import { useToast } from '../../context/ToastContext';
import { reconciliations as reconApi } from './api';
import type { CashReconciliation } from './types';
import type { Order } from '../orders/types';
import type { Expense } from '../expenses/types';
import { formatRupiah, formatDate } from '../../utils/helpers';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/table';
import { CheckCircle2, AlertTriangle, Scale } from 'lucide-react';

interface ReconciliationsPageProps {
  orders: Order[];
  expenses: Expense[];
  fetchData: () => void;
}

export default function ReconciliationsPage({
  orders = [],
  expenses = [],
  fetchData,
}: ReconciliationsPageProps) {
  const { toast } = useToast();
  const [reconciliations, setReconciliations] = useState<CashReconciliation[]>([]);
  const [showAddRecon, setShowAddRecon] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchReconciliations = async () => {
    try {
      setLoading(true);
      const data = await reconApi.list();
      setReconciliations(data || []);
    } catch (err: any) {
      toast.error('Gagal mengambil data rekonsiliasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliations();
  }, []);

  // Compute System Balances dynamically
  const completedOrders = orders.filter(o => o.status === 'COMPLETED');
  
  const getOrderTotal = (order: Order) => {
    return order.items.reduce((s, i) => s + Number(i.finalPrice), 0);
  };

  const cashRevenue = completedOrders
    .filter(o => o.paymentMethod === 'Cash' && o.paymentStatus === 'LUNAS')
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const bcaRevenue = completedOrders
    .filter(o => o.paymentMethod === 'BCA' && o.paymentStatus === 'LUNAS')
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const otherRevenue = completedOrders
    .filter(o => o.paymentMethod === 'Transfer lainnya' && o.paymentStatus === 'LUNAS')
    .reduce((sum, o) => sum + getOrderTotal(o), 0);

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.totalCost || 0), 0);

  const computedCashBalance = Math.max(0, cashRevenue - totalExpense);
  const computedBcaBalance = bcaRevenue + otherRevenue;

  const formik = useFormik({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      account: 'Cash',
      systemBalance: computedCashBalance,
      actualBalance: 0,
      reason: 'Biaya admin',
      notes: '',
      makeAdjustment: true,
    },
    onSubmit: async (values) => {
      try {
        await reconApi.create({
          ...values,
          systemBalance: Number(values.systemBalance),
          actualBalance: Number(values.actualBalance),
        });
        toast.success('Rekonsiliasi kas berhasil disimpan');
        setShowAddRecon(false);
        formik.resetForm();
        fetchReconciliations();
        fetchData();
      } catch (err: any) {
        toast.error(err.message || 'Gagal menyimpan rekonsiliasi');
      }
    },
  });

  // Update systemBalance automatically when account type changes
  useEffect(() => {
    if (formik.values.account === 'Cash') {
      formik.setFieldValue('systemBalance', computedCashBalance);
    } else {
      formik.setFieldValue('systemBalance', computedBcaBalance);
    }
  }, [formik.values.account, computedCashBalance, computedBcaBalance]);

  const difference = formik.values.actualBalance - formik.values.systemBalance;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Rekonsiliasi Kas / Tutup Hari</h1>
          <p className="text-ink-secondary text-xs mt-1">
            Audit saldo kas fisik toko vs saldo kas tercatat di sistem BrewLedger untuk mendeteksi selisih.
          </p>
        </div>
        <Button onClick={() => setShowAddRecon(true)}>
          Rekonsiliasi Kas Baru
        </Button>
      </div>

      {/* History Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-xs text-ink-muted">Memuat data...</div>
        ) : reconciliations.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Akun Kas</TableHead>
                <TableHead align="right">Saldo Sistem</TableHead>
                <TableHead align="right">Saldo Aktual</TableHead>
                <TableHead align="right">Selisih</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead align="center">Status</TableHead>
                <TableHead>Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.map((recon) => {
                const diff = Number(recon.difference);
                const hasDiff = diff !== 0;
                
                return (
                  <TableRow key={recon.id}>
                    <TableCell className="whitespace-nowrap font-mono text-ink-muted">{formatDate(recon.date)}</TableCell>
                    <TableCell className="font-semibold text-ink whitespace-nowrap">{recon.account}</TableCell>
                    <TableCell align="right" className="font-mono text-ink-secondary">{formatRupiah(Number(recon.systemBalance))}</TableCell>
                    <TableCell align="right" className="font-mono text-ink font-bold">{formatRupiah(Number(recon.actualBalance))}</TableCell>
                    <TableCell align="right" className={`font-mono font-bold ${diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-ink-muted'}`}>
                      {diff > 0 ? `+${formatRupiah(diff)}` : diff < 0 ? `-${formatRupiah(Math.abs(diff))}` : 'Sesuai'}
                    </TableCell>
                    <TableCell className="text-ink-secondary">{recon.reason}</TableCell>
                    <TableCell align="center">
                      {!hasDiff ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-success/20 bg-success/10 text-success text-[10px] font-medium font-mono">
                          <CheckCircle2 size={10} /> Sesuai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-warning/20 bg-warning/10 text-warning text-[10px] font-bold font-mono">
                          <AlertTriangle size={10} /> Ada Selisih
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-ink-muted text-xs max-w-xs truncate" title={recon.notes || ''}>
                      {recon.notes || '-'}
                      {recon.adjustTransactionId && (
                        <span className="block text-[9px] text-link font-semibold mt-0.5 font-mono">
                          🔧 Adjusted (ID: {recon.adjustTransactionId.slice(0, 8)})
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-16 text-xs text-ink-muted italic border border-dashed border-border rounded-xl m-4">
            Belum ada histori rekonsiliasi kas. Lakukan Tutup Hari pertama Anda.
          </div>
        )}
      </div>

      {/* Modal Reconciliation Form */}
      <Modal
        isOpen={showAddRecon}
        onClose={() => {
          setShowAddRecon(false);
          formik.resetForm();
        }}
        title="Buat Rekonsiliasi Kas"
        description="Audit saldo laci kas/rekening fisik di akhir hari untuk mencatat dan menyesuaikan selisih pembukuan."
        maxWidth="lg"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4 font-sans text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input 
              label="Tanggal Audit"
              type="date"
              name="date"
              value={formik.values.date}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />

            <Select
              label="Akun Kas"
              name="account"
              value={formik.values.account}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="Cash">Cash (Laci Kas Toko)</option>
              <option value="BCA">BCA (Rekening Bank)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-surface-soft p-3 rounded-lg border border-border">
            <div>
              <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Saldo Menurut Sistem</p>
              <p className="text-sm font-bold text-ink-secondary mt-1 font-mono">{formatRupiah(formik.values.systemBalance)}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-muted font-bold uppercase tracking-wider">Hasil Selisih Kas</p>
              <p className={`text-sm font-bold mt-1 font-mono ${difference > 0 ? 'text-success' : difference < 0 ? 'text-error' : 'text-ink-muted'}`}>
                {difference > 0 ? `+${formatRupiah(difference)}` : difference < 0 ? `-${formatRupiah(Math.abs(difference))}` : 'Sesuai (Rp0)'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input 
              label="Saldo Aktual (Fisik) (Rp)"
              type="number"
              name="actualBalance"
              value={formik.values.actualBalance || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              min={0}
              required
            />

            <Select
              label="Alasan Selisih (Jika Ada)"
              name="reason"
              value={formik.values.reason}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="Biaya admin">Biaya admin bank / e-wallet</option>
              <option value="Transaksi belum dicatat">Transaksi kas belum di-input</option>
              <option value="Pembulatan">Pembulatan nilai kembalian</option>
              <option value="Uang belum diterima">Uang belum diterima pelanggan</option>
              <option value="Salah input">Salah input nominal</option>
              <option value="Selisih kas lainnya">Selisih kas lainnya</option>
            </Select>
          </div>

          <Input 
            label="Catatan Audit tambahan (Opsional)"
            type="text"
            name="notes"
            placeholder="e.g. Kurang Rp 2.000 karena pembulatan es kopi susu"
            value={formik.values.notes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          />

          {difference !== 0 && (
            <div className="bg-warning/10 border border-warning/20 p-3.5 rounded-lg flex items-start gap-2.5">
              <Scale className="text-warning shrink-0 mt-0.5" size={16} />
              <div className="space-y-1">
                <span className="font-bold text-warning text-[10px] uppercase tracking-wider block">Opsi Penyesuaian Kas</span>
                <label className="flex items-center gap-2 cursor-pointer hover:opacity-85 text-ink-secondary mt-1">
                  <input 
                    type="checkbox"
                    name="makeAdjustment"
                    checked={formik.values.makeAdjustment}
                    onChange={formik.handleChange}
                    className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                  />
                  <span>Buat Transaksi Penyesuaian otomatis di Pembukuan Kas (Ledger).</span>
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                setShowAddRecon(false);
                formik.resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Rekonsiliasi
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
