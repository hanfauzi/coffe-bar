import { useState } from 'react';
import { Package, Trash2 } from 'lucide-react';
import { useFormik } from 'formik';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { expenses as expensesApi } from './api';
import type { Expense } from './types';
import type { Ingredient } from '../ingredients/types';
import { formatRupiah, formatDate, getValidationErrorMap } from '../../utils/helpers';
import { Button } from '../../components/ui/button';
import { Modal, ConfirmModal } from '../../components/ui/dialog';
import { Input, RupiahInput } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/table';
import { expenseSchema } from './schemas';

interface ExpensesPageProps {
  expenses: Expense[];
  ingredients: Ingredient[];
  fetchData: () => void;
}

export default function ExpensesPage({
  expenses,
  ingredients,
  fetchData,
}: ExpensesPageProps) {
  const { toast } = useToast();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [inlineNewIngredients, setInlineNewIngredients] = useState<{[key: number]: {name: string, unit: string}}>({});
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  const [activeSubTab, setActiveSubTab] = useState<'history' | 'recommendations'>('history');
  const [selectedIngs, setSelectedIngs] = useState<Record<string, boolean>>({});

  const recommendations = (ingredients || []).map(ing => {
    const curStock = Number(ing.currentStock);
    const resStock = Number(ing.reservedStock || 0);
    const availStock = Number(ing.availableStock ?? curStock);
    const minStock = Number(ing.minimumStock);
    const safetyStockVal = Number(ing.safetyStock || 0);
    
    const targetStock = safetyStockVal > 0 ? safetyStockVal : minStock;
    const recommendedQty = Math.max(0, targetStock - availStock);
    const unitCost = Number(ing.latestUnitCost || 0);
    const estimatedCost = recommendedQty * unitCost;

    let priority: 'Mendesak' | 'Perlu segera' | 'Aman' = 'Aman';
    if (availStock < 0) {
      priority = 'Mendesak';
    } else if (availStock <= minStock) {
      priority = 'Perlu segera';
    }

    return {
      ...ing,
      curStock,
      resStock,
      availStock,
      minStock,
      safetyStockVal,
      targetStock,
      recommendedQty,
      unitCost,
      estimatedCost,
      priority
    };
  });

  const activeRecommendations = recommendations.filter(r => r.recommendedQty > 0);

  const handleUseRecommendations = () => {
    const selectedItems = activeRecommendations.filter(r => selectedIngs[r.id]);
    if (selectedItems.length === 0) {
      toast.error('Pilih minimal satu bahan rekomendasi');
      return;
    }
    
    const items = selectedItems.map(item => ({
      category: item.category as any,
      ingredientId: item.id,
      packCount: 1,
      volumePerPack: item.recommendedQty,
      quantity: item.recommendedQty,
      unit: item.unit,
      totalPrice: item.estimatedCost,
    }));
    
    formik.setFieldValue('items', items);
    setShowAddExpense(true);
    setActiveSubTab('history');
  };

  const handleUpdateSafetyStock = async (ing: Ingredient, newVal: number) => {
    try {
      await api.ingredients.update(ing.id, {
        name: ing.name,
        category: ing.category,
        unit: ing.unit,
        minimumStock: Number(ing.minimumStock),
        safetyStock: Number(newVal),
      });
      toast.success(`Safety stock ${ing.name} berhasil diperbarui`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui safety stock');
    }
  };

  const formik = useFormik({
    initialValues: {
      date: new Date().toISOString().split('T')[0],
      supplier: '',
      notes: 'Offline',
      items: [{ category: 'RAW_MATERIAL' as 'RAW_MATERIAL' | 'PACKAGING' | 'OTHER', ingredientId: '', packCount: 1, volumePerPack: 1, quantity: 0, unit: '', totalPrice: 0 }],
    },
    validate: async (values) => {
      try {
        const itemsFormatted = values.items.map(item => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        }));
        await expenseSchema.validate({
          supplier: values.supplier,
          date: values.date,
          notes: values.notes,
          items: itemsFormatted,
        }, { abortEarly: false });
      } catch (err: any) {
        return getValidationErrorMap(err);
      }
    },
    onSubmit: async (values) => {
      try {
        const itemsFormatted = values.items.map(item => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
        }));
        await expensesApi.create({
          date: values.date,
          supplier: values.supplier,
          notes: values.notes,
          items: itemsFormatted.map((item, idx) => ({
            ...item,
            unit: values.items[idx].unit,
          })),
        });
        setShowAddExpense(false);
        formik.resetForm();
        toast.success('Catatan pembelian berhasil disimpan');
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  const updateInlineNewIngredient = (index: number, key: string, value: string) => {
    setInlineNewIngredients({
      ...inlineNewIngredients,
      [index]: {
        ...(inlineNewIngredients[index] || { name: '', unit: 'gram' }),
        [key]: value
      }
    });
  };

  const handleCreateInlineIngredient = async (index: number) => {
    const data = inlineNewIngredients[index];
    if (!data || !data.name.trim() || !data.unit) {
      toast.error('Nama bahan dan unit harus diisi');
      return;
    }
    try {
      const item = formik.values.items[index];
      const newIng = await api.ingredients.create({
        name: data.name.trim(),
        category: item.category,
        unit: data.unit,
        currentStock: 0,
        minimumStock: 0,
        latestUnitCost: 0,
        isPackaging: item.category === 'PACKAGING',
      });
      
      const copy = [...formik.values.items];
      copy[index].ingredientId = newIng.id;
      copy[index].unit = newIng.unit;
      copy[index].quantity = copy[index].packCount * copy[index].volumePerPack;
      formik.setFieldValue('items', copy);

      const nextInline = { ...inlineNewIngredients };
      delete nextInline[index];
      setInlineNewIngredients(nextInline);

      toast.success(`Bahan "${data.name}" berhasil dibuat`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan bahan baru');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await expensesApi.delete(id);
      toast.success('Pembelian berhasil dihapus');
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
          <h1 className="text-2xl font-bold text-ink tracking-tight">Belanja & Pengeluaran</h1>
          <p className="text-ink-secondary text-xs mt-1">Catat seluruh pengeluaran bahan baku. Stok di inventory dan HPP unit akan ter-update otomatis.</p>
        </div>
        <Button onClick={() => setShowAddExpense(true)}>
          <span className="md:hidden">+</span>
          <span className="hidden md:inline">Catat Pembelian</span>
        </Button>
      </div>

      {/* Sub-tab Navigation */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition cursor-pointer ${
            activeSubTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Histori Belanja
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('recommendations')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'recommendations'
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          Rekomendasi Belanja
          {activeRecommendations.length > 0 && (
            <span className="bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-extrabold animate-pulse">
              {activeRecommendations.length}
            </span>
          )}
        </button>
      </div>

      {/* Recommendations Tab Content */}
      {activeSubTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-surface-soft p-4 rounded-xl border border-border gap-4">
            <p className="text-xs text-ink-secondary leading-relaxed max-w-2xl">
              💡 Rekomendasi belanja dihitung otomatis: **Target Stock** (Safety Stock jika diisi, atau Minimum Stock) dikurangi **Stok Tersedia** (Fisik - Reserved). Centang bahan untuk dimasukkan ke Form Belanja.
            </p>
            <Button onClick={handleUseRecommendations} disabled={activeRecommendations.length === 0}>
              Gunakan Rekomendasi Terpilih
            </Button>
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-x-auto">
            {activeRecommendations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        checked={activeRecommendations.length > 0 && activeRecommendations.every(r => selectedIngs[r.id])}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const newSelected = { ...selectedIngs };
                          activeRecommendations.forEach(r => {
                            newSelected[r.id] = checked;
                          });
                          setSelectedIngs(newSelected);
                        }}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>Nama Bahan</TableHead>
                    <TableHead align="right">Stok Fisik</TableHead>
                    <TableHead align="right">Reserved</TableHead>
                    <TableHead align="right">Tersedia</TableHead>
                    <TableHead>Min. Stock</TableHead>
                    <TableHead>Safety Stock (Target)</TableHead>
                    <TableHead align="right">Qty Disarankan</TableHead>
                    <TableHead align="right">Harga Terakhir</TableHead>
                    <TableHead align="right">Estimasi Biaya</TableHead>
                    <TableHead align="center">Prioritas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRecommendations.map((item) => {
                    const isChecked = !!selectedIngs[item.id];
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              setSelectedIngs({
                                ...selectedIngs,
                                [item.id]: e.target.checked
                              });
                            }}
                            className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-ink">{item.name}</span>
                          <span className="block text-[9px] text-ink-muted uppercase">{item.category}</span>
                        </TableCell>
                        <TableCell align="right" className="font-mono text-ink-secondary">{item.curStock} {item.unit}</TableCell>
                        <TableCell align="right" className="font-mono text-ink-muted">{item.resStock} {item.unit}</TableCell>
                        <TableCell align="right" className={`font-mono font-semibold ${item.availStock < 0 ? 'text-error font-bold' : 'text-ink-secondary'}`}>{item.availStock} {item.unit}</TableCell>
                        <TableCell className="font-mono text-ink-muted">{item.minStock} {item.unit}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              defaultValue={item.safetyStockVal || ''}
                              placeholder={String(item.minStock)}
                              onBlur={(e) => handleUpdateSafetyStock(item, Number(e.target.value))}
                              className="w-16 px-1.5 py-0.5 rounded border border-border text-xs text-center font-mono font-semibold focus:outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-ink-muted">{item.unit}</span>
                          </div>
                        </TableCell>
                        <TableCell align="right" className="font-mono text-primary font-bold">{item.recommendedQty} {item.unit}</TableCell>
                        <TableCell align="right" className="font-mono text-ink-secondary">{formatRupiah(item.unitCost)}</TableCell>
                        <TableCell align="right" className="font-mono text-ink font-bold">{formatRupiah(item.estimatedCost)}</TableCell>
                        <TableCell align="center">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                            item.priority === 'Mendesak'
                              ? 'bg-error/15 border-error/30 text-error animate-pulse'
                              : item.priority === 'Perlu segera'
                                ? 'bg-warning/15 border-warning/30 text-warning'
                                : 'bg-success/15 border-success/30 text-success'
                          }`}>
                            {item.priority}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 text-xs text-ink-muted italic">
                Semua stok bahan baku aman & terpenuhi. Belum ada rekomendasi belanja.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expenses Table Content */}
      {activeSubTab === 'history' && (
        expenses.length > 0 ? (
          <>
            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {expenses.map((exp) => {
                const itemsText = exp.items.map((i) => `${i.quantity} ${i.unitCost > 0 ? i.ingredient?.unit : ''} ${i.ingredient?.name} (${formatRupiah(i.quantity * i.unitCost)})`).join(', ');
                return (
                  <div key={exp.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-xs text-ink">{exp.supplier}</p>
                        <p className="text-[10px] text-ink-muted font-mono mt-0.5">{formatDate(exp.date)}</p>
                      </div>
                      <span className="font-bold text-xs text-ink font-mono">{formatRupiah(exp.totalCost)}</span>
                    </div>

                    <div className="text-xs text-ink-secondary bg-surface-soft p-2.5 rounded-lg border border-border">
                      <span className="font-semibold text-ink">Bahan: </span>
                      {itemsText}
                    </div>

                    <div className="flex justify-between items-center text-[10px] border-t border-border pt-2 text-ink-muted">
                      <span className="truncate max-w-[200px]">Catatan: {exp.notes || '-'}</span>
                      <button 
                        onClick={() => setDeletingExpenseId(exp.id)}
                        className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                        title="Hapus Pembelian"
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
                    <TableHead>Supplier</TableHead>
                    <TableHead>Item Pembelian</TableHead>
                    <TableHead align="right">Total Biaya</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead align="right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((exp) => (
                    <TableRow key={exp.id}>
                      <TableCell className="whitespace-nowrap font-mono text-ink-muted">{formatDate(exp.date)}</TableCell>
                      <TableCell className="font-semibold text-ink whitespace-nowrap">{exp.supplier}</TableCell>
                      <TableCell className="text-ink-secondary whitespace-nowrap max-w-xs truncate">
                        {exp.items.map((i) => `${i.quantity} ${i.unitCost > 0 ? i.ingredient?.unit : ''} ${i.ingredient?.name} (${formatRupiah(i.quantity * i.unitCost)})`).join(', ')}
                      </TableCell>
                      <TableCell align="right" className="font-bold text-ink font-mono">{formatRupiah(exp.totalCost)}</TableCell>
                      <TableCell className="text-ink-muted max-w-xs truncate">{exp.notes || '-'}</TableCell>
                      <TableCell align="right">
                        <button 
                          onClick={() => setDeletingExpenseId(exp.id)}
                          className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                          title="Hapus Pembelian"
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
              <Package size={20} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-ink">Belum Ada Catatan Belanja</h3>
              <p className="text-xs text-ink-secondary">Catat pengeluaran belanja bahan baku kedai untuk meng-update stok inventory.</p>
            </div>
            <Button 
              onClick={() => setShowAddExpense(true)}
              className="mx-auto"
            >
              Catat Pembelian Pertama
            </Button>
          </div>
        )
      )}

      {/* Expense Creation Modal */}
      <Modal
        isOpen={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          formik.resetForm();
        }}
        title="Catat Pembelian Bahan"
        description="Formulir untuk mencatat belanja bahan baku. Input ini otomatis menambah stok dan memperbarui HPP bahan baku."
        maxWidth="2xl"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input 
                label="Tanggal Pembelian"
                type="date"
                name="date"
                value={formik.values.date}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.date ? formik.errors.date : undefined}
              />
            </div>
            <div>
              <Input 
                label="Nama Supplier / Toko"
                type="text" 
                name="supplier"
                placeholder="e.g. Distributor Kopi Sejahtera" 
                value={formik.values.supplier}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.supplier ? formik.errors.supplier : undefined}
              />
            </div>
            <div>
              <Select 
                label="Jenis Pembelian (Metode)"
                name="notes"
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="Offline">Offline (Langsung)</option>
                <option value="Online">Online (E-Commerce)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">Item Belanja</label>
                {formik.touched.items && typeof formik.errors.items === 'string' && (
                  <p className="text-[10px] text-error mt-0.5">{formik.errors.items}</p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => formik.setFieldValue('items', [
                  ...formik.values.items,
                  { category: 'RAW_MATERIAL', ingredientId: '', packCount: 1, volumePerPack: 1, quantity: 0, unit: '', totalPrice: 0 }
                ])}
                className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
              >
                Tambah Item
              </button>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {formik.values.items.map((item, index) => {
                const filteredIngredients = ingredients.filter(ing => ing.category === item.category);
                const unitCost = item.quantity > 0 ? item.totalPrice / item.quantity : 0;
                const itemTouched = formik.touched.items?.[index];
                const itemError = formik.errors.items?.[index] as any;

                return (
                  <div key={index} className="bg-surface-soft p-4 rounded-xl border border-border space-y-3 relative">
                    {/* Top Row: Category and Ingredient Selector */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Select 
                        label="Jenis Pembelian"
                        value={item.category}
                        onChange={(e) => {
                          const copy = [...formik.values.items];
                          copy[index].category = e.target.value as any;
                          copy[index].ingredientId = '';
                          copy[index].unit = '';
                          copy[index].volumePerPack = 1;
                          copy[index].quantity = 0;
                          formik.setFieldValue('items', copy);
                        }}
                        required
                      >
                        <option value="RAW_MATERIAL">Bahan Baku (Raw Material)</option>
                        <option value="PACKAGING">Kemasan (Packaging)</option>
                        <option value="OTHER">Alat & Lainnya (Equipment/Other)</option>
                      </Select>

                      <Select 
                        label="Nama Barang / Bahan"
                        value={item.ingredientId}
                        onChange={(e) => {
                          const copy = [...formik.values.items];
                          copy[index].ingredientId = e.target.value;
                          if (e.target.value === '__NEW__') {
                            copy[index].unit = '';
                            copy[index].quantity = 0;
                            updateInlineNewIngredient(index, 'name', '');
                            updateInlineNewIngredient(index, 'unit', 'gram');
                          } else {
                            const matchIng = ingredients.find(ing => ing.id === e.target.value);
                            if (matchIng) {
                              copy[index].unit = matchIng.unit;
                            }
                            copy[index].quantity = copy[index].packCount * copy[index].volumePerPack;
                          }
                          formik.setFieldValue('items', copy);
                        }}
                        error={itemTouched?.ingredientId ? itemError?.ingredientId : undefined}
                        required
                      >
                        <option value="">Pilih Barang / Bahan</option>
                        <option value="__NEW__" className="text-primary font-bold">Tambah Bahan Baru</option>
                        {filteredIngredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                        ))}
                      </Select>
                    </div>

                    {/* Inline New Ingredient Form */}
                    {item.ingredientId === '__NEW__' && (
                      <div className="bg-canvas border border-primary/20 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between items-center border-b border-border pb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Tambah Bahan Baru ({item.category === 'RAW_MATERIAL' ? 'Bahan Baku' : item.category === 'PACKAGING' ? 'Kemasan' : 'Lainnya'})</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <Input 
                            label="Nama Bahan / Barang Baru"
                            type="text"
                            placeholder="e.g. Susu UHT Oat"
                            value={inlineNewIngredients[index]?.name || ''}
                            onChange={(e) => updateInlineNewIngredient(index, 'name', e.target.value)}
                            required
                          />
                          <Select 
                            label="Satuan Unit"
                            value={inlineNewIngredients[index]?.unit || 'gram'}
                            onChange={(e) => updateInlineNewIngredient(index, 'unit', e.target.value)}
                            required
                          >
                            <option value="gram">gram</option>
                            <option value="ml">ml</option>
                            <option value="pcs">pcs</option>
                            <option value="pack">pack</option>
                            <option value="kg">kg</option>
                            <option value="liter">liter</option>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button 
                            type="button"
                            onClick={() => {
                              const copy = [...formik.values.items];
                              copy[index].ingredientId = '';
                              formik.setFieldValue('items', copy);
                            }}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold text-ink-secondary hover:bg-surface border border-border cursor-pointer transition active:scale-95"
                          >
                            Batal
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleCreateInlineIngredient(index)}
                            className="px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-primary hover:bg-primary-hover cursor-pointer transition active:scale-95"
                          >
                            Simpan & Pilih
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Smart Quantity & Price Calculator */}
                    {item.ingredientId && item.ingredientId !== '__NEW__' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                        <Input 
                          label="Jumlah Beli (Pack/Pcs)"
                          type="number" 
                          placeholder="e.g. 2"
                          value={item.packCount || ''}
                          onChange={(e) => {
                            const copy = [...formik.values.items];
                            const packs = Number(e.target.value);
                            copy[index].packCount = packs;
                            copy[index].quantity = packs * copy[index].volumePerPack;
                            formik.setFieldValue('items', copy);
                          }}
                          min={0.01}
                          step="any"
                          error={itemTouched?.quantity ? itemError?.quantity : undefined}
                          required
                        />

                        <Input 
                          label={`Isi per Pack (${item.unit})`}
                          type="number" 
                          placeholder="e.g. 950"
                          value={item.volumePerPack || ''}
                          onChange={(e) => {
                            const copy = [...formik.values.items];
                            const vol = Number(e.target.value);
                            copy[index].volumePerPack = vol;
                            copy[index].quantity = copy[index].packCount * vol;
                            formik.setFieldValue('items', copy);
                          }}
                          min={0.01}
                          step="any"
                          required
                        />

                        <RupiahInput 
                          label="Total Harga (Rp)"
                          placeholder="e.g. Rp 38.000"
                          value={item.totalPrice}
                          onChange={(val) => {
                            const copy = [...formik.values.items];
                            copy[index].totalPrice = val || 0;
                            formik.setFieldValue('items', copy);
                          }}
                          error={itemTouched?.totalPrice ? itemError?.totalPrice : undefined}
                          required
                        />

                        {/* Computed Output Display */}
                        <div className="flex flex-col justify-end h-10 pb-1 px-1">
                          <span className="text-[10px] text-ink-secondary font-semibold font-mono">
                            Total: {item.quantity.toLocaleString('id-ID')} {item.unit}
                          </span>
                          {unitCost > 0 && (
                            <span className="text-[9px] text-link font-mono">
                              HPP: {formatRupiah(unitCost)}/{item.unit}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Delete button positioned top-right for cleanliness */}
                    <button 
                      type="button"
                      onClick={() => {
                        formik.setFieldValue(
                          'items',
                          formik.values.items.filter((_, i) => i !== index),
                        );
                      }}
                      className="absolute top-2 right-2 text-ink-faint hover:text-error p-1 cursor-pointer transition"
                      title="Hapus Item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                setShowAddExpense(false);
                formik.resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              Simpan Belanja
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deletingExpenseId}
        onClose={() => setDeletingExpenseId(null)}
        onConfirm={() => {
          if (deletingExpenseId) {
            handleDeleteExpense(deletingExpenseId);
          }
        }}
        title="Hapus Pembelian"
        description="Apakah Anda yakin ingin menghapus pembelian ini? Stok bahan baku akan dikurangi secara otomatis."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
