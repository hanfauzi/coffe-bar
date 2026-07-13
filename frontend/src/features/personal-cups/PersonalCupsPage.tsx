import { useState } from 'react';
import { Coffee, Trash2 } from 'lucide-react';
import { useFormik } from 'formik';
import { useToast } from '../../context/ToastContext';
import { personalCups as personalCupsApi } from './api';
import type { PersonalCup } from './types';
import type { MenuItem } from '../menus/types';
import { formatRupiah, formatDateTime } from '../../utils/helpers';
import { Button } from '../../components/ui/button';
import { Modal, ConfirmModal } from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/table';
import { personalCupSchema } from './schemas';

interface PersonalCupsPageProps {
  consumptions: PersonalCup[];
  menus: MenuItem[];
  fetchData: () => void;
}

export default function PersonalCupsPage({
  consumptions,
  menus,
  fetchData,
}: PersonalCupsPageProps) {
  const { toast } = useToast();
  const [showAddPersonal, setShowAddPersonal] = useState(false);
  const [deletingConsumptionId, setDeletingConsumptionId] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      menuId: '',
      useCup: true,
      notes: '',
      date: new Date().toISOString().split('T')[0],
    },
    validationSchema: personalCupSchema,
    onSubmit: async (values) => {
      try {
        await personalCupsApi.create(values);
        setShowAddPersonal(false);
        formik.resetForm();
        toast.success('Konsumsi pribadi berhasil disimpan');
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  const handleDeleteConsumption = async (id: string) => {
    try {
      await personalCupsApi.delete(id);
      toast.success('Log konsumsi berhasil dihapus');
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
          <h1 className="text-2xl font-bold text-ink tracking-tight">Konsumsi Pribadi & Staff</h1>
          <p className="text-ink-secondary text-xs mt-1">Catat kopi yang dikonsumsi sendiri/staff. Mutasi ini memotong stok bahan baku tanpa menambah revenue.</p>
        </div>
        <Button onClick={() => setShowAddPersonal(true)}>
          <span className="md:hidden">+</span>
          <span className="hidden md:inline">Catat Konsumsi</span>
        </Button>
      </div>

      {/* Consumption Table */}
      {consumptions.length > 0 ? (
        <>
          {/* Mobile View (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {consumptions.map((c) => (
              <div key={c.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-xs text-ink">{c.menu?.name}</p>
                    <p className="text-[10px] text-ink-muted font-mono mt-0.5">{formatDateTime(c.date)}</p>
                  </div>
                  <span className="font-bold text-xs text-ink font-mono">{formatRupiah(c.estimatedCost || 0)}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium whitespace-nowrap ${
                    c.useCup ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-warning/10 border-warning/20 text-warning'
                  }`}>
                    {c.useCup ? 'Pakai Cup Gelas' : 'Tanpa Cup (Gelas Sendiri)'}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-border pt-2 text-ink-muted">
                  <span className="truncate max-w-[200px]">Catatan: {c.notes || '-'}</span>
                  <button 
                    onClick={() => setDeletingConsumptionId(c.id)}
                    className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                    title="Hapus Log"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto bg-surface border border-border rounded-xl shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Drink Menu</TableHead>
                  <TableHead>Pakai Cup?</TableHead>
                  <TableHead align="right">Estimasi Cost (HPP)</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead align="right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptions.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="whitespace-nowrap font-mono text-ink-muted">{formatDateTime(c.date)}</TableCell>
                    <TableCell className="font-semibold text-ink whitespace-nowrap">{c.menu?.name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium whitespace-nowrap ${
                        c.useCup ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-warning/10 border-warning/20 text-warning'
                      }`}>
                        {c.useCup ? 'Pakai Cup Gelas' : 'Tanpa Cup (Gelas Sendiri)'}
                      </span>
                    </TableCell>
                    <TableCell align="right" className="font-mono text-ink whitespace-nowrap">{formatRupiah(c.estimatedCost || 0)}</TableCell>
                    <TableCell className="text-ink-muted max-w-xs truncate">{c.notes || '-'}</TableCell>
                    <TableCell align="right">
                      <button 
                        onClick={() => setDeletingConsumptionId(c.id)}
                        className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                        title="Hapus Log"
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
            <Coffee size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">Belum Ada Konsumsi Pribadi</h3>
            <p className="text-xs text-ink-secondary">Catat kopi konsumsi sendiri untuk audit stok bahan baku yang akurat.</p>
          </div>
          <Button 
            onClick={() => setShowAddPersonal(true)}
            className="mx-auto"
          >
            Catat Konsumsi Pertama
          </Button>
        </div>
      )}

      {/* Modal: Add Personal Cup */}
      <Modal
        isOpen={showAddPersonal}
        onClose={() => {
          setShowAddPersonal(false);
          formik.resetForm();
        }}
        title="Catat Konsumsi Sendiri"
        description="Mencatat konsumsi kopi internal agar tingkat penyusutan bahan baku termonitor."
      >
        <form onSubmit={formik.handleSubmit} className="space-y-4">
          <Select 
            label="Pilih Menu Minuman"
            name="menuId"
            value={formik.values.menuId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.menuId ? formik.errors.menuId : undefined}
          >
            <option value="">Pilih Menu</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </Select>

          <div className="flex items-center gap-2.5 py-2.5 bg-surface-soft border border-border px-3 rounded-lg">
            <input 
              type="checkbox"
              id="useCupCheckbox"
              name="useCup"
              checked={formik.values.useCup}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className="rounded border-border text-primary focus:ring-0 cursor-pointer"
            />
            <label htmlFor="useCupCheckbox" className="text-xs text-ink-secondary cursor-pointer select-none font-medium">
              Gunakan Kemasan Gelas & Sedotan
            </label>
          </div>

          <Input 
            label="Catatan (e.g. Minum Sore / Staff)"
            type="text" 
            name="notes"
            placeholder="e.g. Istirahat sore"
            value={formik.values.notes}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.notes ? formik.errors.notes : undefined}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                setShowAddPersonal(false);
                formik.resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              Simpan Konsumsi
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingConsumptionId}
        onClose={() => setDeletingConsumptionId(null)}
        onConfirm={() => {
          if (deletingConsumptionId) {
            handleDeleteConsumption(deletingConsumptionId);
          }
        }}
        title="Hapus Log Konsumsi"
        description="Apakah Anda yakin ingin menghapus log konsumsi pribadi ini? Stok bahan baku akan dikembalikan otomatis."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
