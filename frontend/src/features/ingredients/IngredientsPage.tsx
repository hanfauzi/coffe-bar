import { useState, useEffect } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import { useFormik } from 'formik';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { ingredients as ingredientsApi } from './api';
import type { Ingredient } from './types';
import type { MenuItem } from '../menus/types';
import { formatRupiah, translateCategory } from '../../utils/helpers';
import { Button } from '../../components/ui/button';
import { Modal, ConfirmModal } from '../../components/ui/dialog';
import { Input, RupiahInput } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/table';
import { ingredientSchema, ingredientEditSchema, adjustStockSchema } from './schemas';

interface IngredientsPageProps {
  ingredients: Ingredient[];
  menus: MenuItem[];
  fetchData: () => void;
}

export default function IngredientsPage({
  ingredients,
  menus,
  fetchData,
}: IngredientsPageProps) {
  const { toast } = useToast();
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [buyPriceHelper, setBuyPriceHelper] = useState<number>(0);
  const [quantityHelper, setQuantityHelper] = useState<number>(0);
  const [showAdjustStock, setShowAdjustStock] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState('MANUAL_ADJUSTMENT');
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<{ id: string; name: string } | null>(null);

  // Formik 1: Add Ingredient
  const addFormik = useFormik({
    initialValues: {
      name: '',
      category: 'RAW_MATERIAL' as Ingredient['category'],
      currentStock: 0,
      unit: 'gram',
      minimumStock: 0,
      safetyStock: 0,
      latestUnitCost: 0,
      isPackaging: false,
    },
    validationSchema: ingredientSchema,
    onSubmit: async (values) => {
      try {
        await ingredientsApi.create(values);
        setShowAddIngredient(false);
        addFormik.resetForm();
        setBuyPriceHelper(0);
        setQuantityHelper(0);
        toast.success('Bahan baku baru berhasil disimpan');
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  // Formik 2: Adjust Stock
  const adjustFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      quantityChange: 0,
      notes: '',
    },
    validationSchema: adjustStockSchema,
    onSubmit: async (values) => {
      if (!showAdjustStock) return;
      try {
        await api.inventory.adjust({
          ingredientId: showAdjustStock,
          quantityChange: values.quantityChange,
          type: adjustmentType,
          notes: values.notes,
        });
        setShowAdjustStock(null);
        adjustFormik.resetForm();
        toast.success('Stok berhasil disesuaikan');
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  // Formik 3: Edit Ingredient
  const editFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: editingIngredient?.name || '',
      category: (editingIngredient?.category || 'RAW_MATERIAL') as Ingredient['category'],
      unit: editingIngredient?.unit || '',
      minimumStock: editingIngredient?.minimumStock || 0,
      safetyStock: editingIngredient?.safetyStock || 0,
    },
    validationSchema: ingredientEditSchema,
    onSubmit: async (values) => {
      if (!editingIngredient) return;
      try {
        await ingredientsApi.update(editingIngredient.id, {
          name: values.name,
          category: values.category,
          unit: values.unit,
          minimumStock: values.minimumStock,
          safetyStock: values.safetyStock,
        });
        setEditingIngredient(null);
        editFormik.resetForm();
        toast.success('Bahan baku berhasil diperbarui.');
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  // Handle unit cost helper calculation
  useEffect(() => {
    const cost = quantityHelper > 0 ? buyPriceHelper / quantityHelper : 0;
    addFormik.setFieldValue('latestUnitCost', cost);
  }, [buyPriceHelper, quantityHelper]);

  const handleDeleteIngredient = async (id: string) => {
    try {
      await ingredientsApi.delete(id);
      toast.success('Bahan baku berhasil dihapus');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Calculate max portions for each active menu item based on current stock of non-optional ingredients
  const menuEstimations = (menus || []).map((menu) => {
    const requiredRecipes = menu.recipes?.filter((r) => !r.optional) || [];
    
    if (requiredRecipes.length === 0) {
      return {
        ...menu,
        portions: 0,
        limitingIngredient: null,
        hasNoRecipe: true
      };
    }

    let minPortions = Infinity;
    let limitingIngredientName = '';
    let limitingIngredientStock = 0;
    let limitingIngredientRequired = 0;
    let limitingIngredientUnit = '';

    for (const recipe of requiredRecipes) {
      const ingredient = ingredients.find((ing) => ing.id === recipe.ingredientId);
      const stock = ingredient ? Number(ingredient.currentStock) : 0;
      const quantityNeeded = Number(recipe.quantity);

      if (quantityNeeded <= 0) continue;

      const portions = Math.floor(stock / quantityNeeded);
      if (portions < minPortions) {
        minPortions = portions;
        limitingIngredientName = ingredient ? ingredient.name : 'Bahan tidak dikenal';
        limitingIngredientStock = stock;
        limitingIngredientRequired = quantityNeeded;
        limitingIngredientUnit = ingredient ? ingredient.unit : recipe.unit;
      }
    }

    return {
      ...menu,
      portions: minPortions === Infinity ? 0 : minPortions,
      limitingIngredient: minPortions === Infinity ? null : {
        name: limitingIngredientName,
        stock: limitingIngredientStock,
        required: limitingIngredientRequired,
        unit: limitingIngredientUnit
      },
      hasNoRecipe: false
    };
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Kelola Bahan Baku</h1>
          <p className="text-ink-secondary text-xs mt-1">Daftar master bahan baku, kemasan (packaging), dan ambang batas peringatan stok minimum.</p>
        </div>
        <Button onClick={() => setShowAddIngredient(true)}>
          <span className="md:hidden">+</span>
          <span className="hidden md:inline">Tambah Bahan Baku</span>
        </Button>
      </div>

      {/* Master Table */}
      {ingredients.length > 0 ? (
        <>
          {/* Mobile View (Cards) */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {ingredients.map((ing) => {
              const curStock = Number(ing.currentStock);
              const resStock = Number(ing.reservedStock || 0);
              const availStock = Number(ing.availableStock ?? curStock);
              const minStock = Number(ing.minimumStock);
              const isLow = availStock <= minStock;
              const isOut = availStock <= 0;
              return (
                <div key={ing.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-xs text-ink">{ing.name}</p>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        <span className="bg-surface-soft px-2 py-0.5 rounded border border-border text-[9px] font-mono">
                          {translateCategory(ing.category)}
                        </span>
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${
                      isOut ? 'bg-error/10 border-error/20 text-error' :
                      isLow ? 'bg-warning/10 border-warning/20 text-warning' :
                      'bg-success/10 border-success/20 text-success'
                    }`}>
                      {isOut ? 'Habis' : isLow ? 'Stok Rendah' : 'Tersedia'}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono bg-surface-soft p-2 rounded-lg border border-border">
                    <div>
                      <p className="text-[8px] text-ink-muted uppercase">Fisik</p>
                      <p className="font-bold text-ink">{curStock}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-ink-muted uppercase">Reserved</p>
                      <p className="font-semibold text-ink-secondary">{resStock}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-ink-muted uppercase">Tersedia</p>
                      <p className="font-bold text-primary">{availStock}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-ink-muted uppercase">Min</p>
                      <p className="font-semibold text-ink-muted">{minStock}</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-ink-secondary flex justify-between px-1">
                    <span>Harga Satuan:</span>
                    <span className="font-semibold">{formatRupiah(ing.latestUnitCost)} / {ing.unit}</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-1 text-[11px] font-semibold">
                    <button 
                      onClick={() => setEditingIngredient(ing)}
                      className="text-link hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => {
                        setShowAdjustStock(ing.id);
                        adjustFormik.resetForm();
                      }}
                      className="text-link hover:underline cursor-pointer"
                    >
                      Sesuaikan Stok
                    </button>
                    <button 
                      onClick={() => setDeletingIngredient({ id: ing.id, name: ing.name })}
                      className="text-ink-faint hover:text-error cursor-pointer"
                    >
                      Hapus
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
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead align="right">Stok Fisik</TableHead>
                  <TableHead align="right">Reserved</TableHead>
                  <TableHead align="right">Tersedia</TableHead>
                  <TableHead align="right">Batas Min</TableHead>
                  <TableHead align="right">Safety Stock</TableHead>
                  <TableHead align="right">Harga Satuan</TableHead>
                  <TableHead align="center">Status</TableHead>
                  <TableHead align="right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredients.map((ing) => {
                  const curStock = Number(ing.currentStock);
                  const resStock = Number(ing.reservedStock || 0);
                  const availStock = Number(ing.availableStock ?? curStock);
                  const minStock = Number(ing.minimumStock);
                  const safetyStockVal = Number(ing.safetyStock || 0);
                  const isLow = availStock <= minStock;
                  const isOut = availStock <= 0;
                  return (
                    <TableRow key={ing.id}>
                      <TableCell className="font-semibold text-ink whitespace-nowrap">{ing.name}</TableCell>
                      <TableCell className="text-ink-muted whitespace-nowrap">
                        <span className="bg-surface-soft px-2 py-0.5 rounded border border-border text-[10px] font-mono">
                          {translateCategory(ing.category)}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="font-bold text-ink font-mono whitespace-nowrap">{curStock} {ing.unit}</TableCell>
                      <TableCell align="right" className="text-ink-secondary font-mono whitespace-nowrap">{resStock} {ing.unit}</TableCell>
                      <TableCell align="right" className="font-extrabold text-primary font-mono whitespace-nowrap">{availStock} {ing.unit}</TableCell>
                      <TableCell align="right" className="text-ink-muted font-mono whitespace-nowrap">{minStock} {ing.unit}</TableCell>
                      <TableCell align="right" className="text-ink-muted font-mono whitespace-nowrap">{safetyStockVal} {ing.unit}</TableCell>
                      <TableCell align="right" className="font-mono text-ink whitespace-nowrap">{formatRupiah(ing.latestUnitCost)} / {ing.unit}</TableCell>
                      <TableCell align="center">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${
                          isOut ? 'bg-error/10 border-error/20 text-error' :
                          isLow ? 'bg-warning/10 border-warning/20 text-warning' :
                          'bg-success/10 border-success/20 text-success'
                        }`}>
                          {isOut ? 'Habis' : isLow ? 'Stok Rendah' : 'Tersedia'}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="space-x-2 whitespace-nowrap">
                        <button 
                          onClick={() => {
                            setEditingIngredient(ing);
                          }}
                          className="text-[11px] text-link hover:underline font-semibold cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setShowAdjustStock(ing.id);
                            adjustFormik.resetForm();
                          }}
                          className="text-[11px] text-link hover:underline font-semibold cursor-pointer"
                        >
                          Sesuaikan Stok
                        </button>
                        <button 
                          onClick={() => setDeletingIngredient({ id: ing.id, name: ing.name })}
                          className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                          title="Hapus Master"
                        >
                          <Trash2 size={13} className="inline mb-0.5" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <div className="bg-surface border border-border rounded-xl text-center py-16 px-6 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-soft flex items-center justify-center text-ink-muted">
            <Layers size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-ink">Belum Ada Bahan Baku</h3>
            <p className="text-xs text-ink-secondary">Mulai tambahkan daftar bahan baku master untuk kedai kopi Anda.</p>
          </div>
          <Button 
            onClick={() => setShowAddIngredient(true)}
            className="mx-auto"
          >
            Tambah Bahan Baku Pertama
          </Button>
        </div>
      )}

      {/* Section: Estimasi Porsi Menu */}
      <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-ink tracking-tight">Estimasi Porsi Menu dari Sisa Stok</h2>
          <p className="text-ink-secondary text-xs mt-1">
            Perkiraan jumlah porsi yang bisa dibuat berdasarkan ketersediaan sisa stok bahan baku saat ini (takaran gula normal).
          </p>
        </div>

        {menuEstimations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menuEstimations.map((est) => {
              const portions = est.portions;
              
              let badgeColorClass = 'bg-success/10 border-success/20 text-success';
              if (est.hasNoRecipe) {
                badgeColorClass = 'bg-ink-muted/10 border-ink-muted/20 text-ink-muted';
              } else if (portions === 0) {
                badgeColorClass = 'bg-error/10 border-error/20 text-error';
              } else if (portions <= 5) {
                badgeColorClass = 'bg-warning/10 border-warning/20 text-warning';
              }

              return (
                <div key={est.id} className="bg-surface-soft border border-border p-4 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-semibold text-xs text-ink truncate" title={est.name}>{est.name}</h4>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold whitespace-nowrap ${badgeColorClass}`}>
                        {est.hasNoRecipe ? 'Belum Ada Resep' : `${portions} porsi`}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted">
                      {est.category === "ADDITIONAL" ? "Additional / Extra" : "Menu Utama"}
                    </p>
                  </div>

                  {!est.hasNoRecipe && est.limitingIngredient && (
                    <div className="text-[10px] font-mono text-ink-secondary pt-2 border-t border-border/60">
                      {portions === 0 ? (
                        <p className="text-error font-medium">
                          Bahan habis: <span className="font-semibold">{est.limitingIngredient.name}</span>
                        </p>
                      ) : (
                        <p>
                          Dibatasi oleh: <span className="text-ink font-semibold">{est.limitingIngredient.name}</span>
                          <span className="block text-[9px] text-ink-muted mt-0.5">
                            (Stok: {est.limitingIngredient.stock} / Butuh: {est.limitingIngredient.required} {est.limitingIngredient.unit})
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                  {est.hasNoRecipe && (
                    <p className="text-[10px] text-ink-muted italic pt-2 border-t border-border/60">
                      Resep belum dikonfigurasi.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-ink-secondary italic">Belum ada menu yang terdaftar untuk dikalkulasi.</p>
        )}
      </div>

      {/* Modal: Add Ingredient */}
      <Modal
        isOpen={showAddIngredient}
        onClose={() => setShowAddIngredient(false)}
        title="Tambah Bahan Baku Master"
        description="Buat data entitas bahan baku baru dalam sistem database."
      >
        <form onSubmit={addFormik.handleSubmit} className="space-y-4">
          <Input 
            label="Nama Bahan Baku"
            type="text" 
            name="name"
            placeholder="e.g. Biji Kopi Arabica Toraja" 
            value={addFormik.values.name}
            onChange={addFormik.handleChange}
            onBlur={addFormik.handleBlur}
            error={addFormik.touched.name ? addFormik.errors.name : undefined}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select 
              label="Kategori"
              name="category"
              value={addFormik.values.category}
              onChange={(e) => {
                addFormik.handleChange(e);
                addFormik.setFieldValue('isPackaging', e.target.value === 'PACKAGING');
              }}
              onBlur={addFormik.handleBlur}
            >
              <option value="RAW_MATERIAL">Bahan Baku (Raw)</option>
              <option value="PACKAGING">Kemasan (Packaging)</option>
              <option value="OTHER">Lainnya</option>
            </Select>

            <Input 
              label="Satuan Unit"
              type="text" 
              name="unit"
              placeholder="e.g. gram, ml, pcs" 
              value={addFormik.values.unit}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              error={addFormik.touched.unit ? addFormik.errors.unit : undefined}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input 
              label="Stok Awal"
              type="number" 
              name="currentStock"
              value={addFormik.values.currentStock || ''}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              min={0}
              step="any"
              error={addFormik.touched.currentStock ? addFormik.errors.currentStock : undefined}
            />
            <Input 
              label="Stok Min"
              type="number" 
              name="minimumStock"
              value={addFormik.values.minimumStock || ''}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              min={0}
              step="any"
              error={addFormik.touched.minimumStock ? addFormik.errors.minimumStock : undefined}
            />
            <Input 
              label="Safety Stock"
              type="number" 
              name="safetyStock"
              value={addFormik.values.safetyStock || ''}
              onChange={addFormik.handleChange}
              onBlur={addFormik.handleBlur}
              min={0}
              step="any"
              error={addFormik.touched.safetyStock ? addFormik.errors.safetyStock : undefined}
            />
          </div>

          <div className="bg-surface-soft p-3.5 rounded-lg border border-border space-y-3">
            <p className="font-bold text-[9px] text-ink-secondary uppercase tracking-wider">Kalkulator HPP Satuan (Pembelian Terakhir)</p>
            <div className="grid grid-cols-2 gap-2">
              <RupiahInput 
                label="Harga Beli Total (Rp)"
                placeholder="e.g. Rp 150.000"
                value={buyPriceHelper}
                onChange={(val) => {
                  setBuyPriceHelper(val || 0);
                }}
              />
              <Input 
                label="Isi/Volume per Pack"
                type="number" 
                placeholder="e.g. 1000"
                value={quantityHelper || ''}
                onChange={(e) => {
                  setQuantityHelper(Number(e.target.value));
                }}
              />
            </div>
          </div>

          <RupiahInput 
            label="Harga Satuan Unit (Rp)"
            placeholder="Harga per unit" 
            value={addFormik.values.latestUnitCost}
            onChange={(val) => addFormik.setFieldValue('latestUnitCost', val || 0)}
            error={addFormik.touched.latestUnitCost ? addFormik.errors.latestUnitCost : undefined}
          />
          {addFormik.values.latestUnitCost > 0 && (
            <p className="text-[10px] text-link mt-1.5 font-mono">
              (= {formatRupiah(addFormik.values.latestUnitCost)} per {addFormik.values.unit || 'unit'})
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                setShowAddIngredient(false);
                addFormik.resetForm();
                setBuyPriceHelper(0);
                setQuantityHelper(0);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={addFormik.isSubmitting}>
              Simpan Bahan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Adjust Stock */}
      <Modal
        isOpen={!!showAdjustStock}
        onClose={() => setShowAdjustStock(null)}
        title="Penyesuaian Stok Manual"
        description="Perbarui level stok untuk koreksi inventaris atau sisa bahan yang rusak."
      >
        <form onSubmit={adjustFormik.handleSubmit} className="space-y-4">
          <Input 
            label="Jumlah Perubahan"
            type="number" 
            name="quantityChange"
            placeholder="Gunakan tanda minus (-) untuk mengurangi" 
            value={adjustFormik.values.quantityChange || ''}
            onChange={adjustFormik.handleChange}
            onBlur={adjustFormik.handleBlur}
            step="any"
            error={adjustFormik.touched.quantityChange ? adjustFormik.errors.quantityChange : undefined}
          />

          <Select
            label="Tipe Mutasi"
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value)}
          >
            <option value="MANUAL_ADJUSTMENT">Penyesuaian Manual</option>
            <option value="WASTE">Bahan Rusak / Kadaluarsa</option>
            <option value="CORRECTION">Koreksi Audit</option>
          </Select>

          <Input 
            label="Keterangan / Alasan"
            type="text" 
            name="notes"
            placeholder="e.g. Susut timbangan / bocor" 
            value={adjustFormik.values.notes}
            onChange={adjustFormik.handleChange}
            onBlur={adjustFormik.handleBlur}
            error={adjustFormik.touched.notes ? adjustFormik.errors.notes : undefined}
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => {
                setShowAdjustStock(null);
                adjustFormik.resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={adjustFormik.isSubmitting}>
              Simpan Mutasi
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Ingredient */}
      <Modal
        isOpen={!!editingIngredient}
        onClose={() => setEditingIngredient(null)}
        title="Edit Bahan Baku"
        description="Ubah data master untuk bahan baku yang terdaftar."
      >
        {editingIngredient && (
          <form onSubmit={editFormik.handleSubmit} className="space-y-4">
            <Input 
              label="Nama Bahan Baku"
              type="text" 
              name="name"
              value={editFormik.values.name}
              onChange={editFormik.handleChange}
              onBlur={editFormik.handleBlur}
              error={editFormik.touched.name ? editFormik.errors.name : undefined}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select 
                label="Kategori"
                name="category"
                value={editFormik.values.category}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
              >
                <option value="RAW_MATERIAL">Bahan Baku (Raw)</option>
                <option value="PACKAGING">Kemasan (Packaging)</option>
                <option value="OTHER">Lainnya</option>
              </Select>

              <Input 
                label="Satuan Unit"
                type="text" 
                name="unit"
                value={editFormik.values.unit}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                error={editFormik.touched.unit ? editFormik.errors.unit : undefined}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input 
                label="Stok Minimum (Warning)"
                type="number" 
                name="minimumStock"
                value={editFormik.values.minimumStock}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                min={0}
                step="any"
                error={editFormik.touched.minimumStock ? editFormik.errors.minimumStock : undefined}
              />
              <Input 
                label="Safety Stock"
                type="number" 
                name="safetyStock"
                value={editFormik.values.safetyStock}
                onChange={editFormik.handleChange}
                onBlur={editFormik.handleBlur}
                min={0}
                step="any"
                error={editFormik.touched.safetyStock ? editFormik.errors.safetyStock : undefined}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => {
                  setEditingIngredient(null);
                  editFormik.resetForm();
                }}
              >
                Batal
              </Button>
              <Button type="submit" disabled={editFormik.isSubmitting}>
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmModal
        isOpen={!!deletingIngredient}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={() => {
          if (deletingIngredient) {
            handleDeleteIngredient(deletingIngredient.id);
          }
        }}
        title="Hapus Bahan Baku"
        description={`Apakah Anda yakin ingin menghapus bahan baku "${deletingIngredient?.name}"? Semua resep yang menggunakan bahan ini mungkin akan terganggu.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
