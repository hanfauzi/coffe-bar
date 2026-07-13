import { useState } from 'react';
import { Trash2, CheckCircle2, Clock, User, Edit2 } from 'lucide-react';
import { useFormik } from 'formik';
import { useToast } from '../../context/ToastContext';
import { orders as ordersApi } from './api';
import type { Order } from './types';
import type { MenuItem } from '../menus/types';
import type { Ingredient } from '../ingredients/types';
import { formatRupiah, formatDate, getValidationErrorMap } from '../../utils/helpers';
import { Button } from '../../components/ui/button';
import { Modal, ConfirmModal } from '../../components/ui/dialog';
import { Input, Textarea, RupiahInput } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from '../../components/ui/table';
import { orderSchema } from './schemas';

interface OrdersPageProps {
  orders: Order[];
  menus: MenuItem[];
  ingredients: Ingredient[];
  fetchData: () => void;
}

export default function OrdersPage({
  orders = [],
  menus = [],
  ingredients = [],
  fetchData,
}: OrdersPageProps) {
  const { toast } = useToast();
  const mainMenus = menus.filter(m => m.category !== 'ADDITIONAL');
  const addonMenus = menus.filter(m => m.category === 'ADDITIONAL');

  const [showAddOrder, setShowAddOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [viewNotes, setViewNotes] = useState<string | null>(null);

  const [completePaymentMethod, setCompletePaymentMethod] = useState('Cash');
  const [completePaymentStatus, setCompletePaymentStatus] = useState('LUNAS');
  const [completeResolvedAt, setCompleteResolvedAt] = useState(new Date().toISOString().split('T')[0]);
  const [completeNotes, setCompleteNotes] = useState('');

  const formik = useFormik({
    initialValues: {
      orderDate: new Date().toISOString().split('T')[0],
      customerName: '',
      notes: '',
      items: [{ menuId: '', quantity: 1, unitPrice: 0, customPrice: null as number | null, excludedIngredients: [] as string[], sugarLevel: 'NORMAL', extras: [] as { menuId: string; quantity: number; unitPrice: number }[] }],
    },
    validate: async (values) => {
      try {
        const itemsFormatted = values.items.map(i => ({
          menuId: i.menuId,
          quantity: i.quantity,
          sugarLevel: i.sugarLevel || 'NORMAL',
          extras: (i.extras || []).map(ex => ({
            menuId: ex.menuId,
            quantity: ex.quantity,
          })),
        }));
        await orderSchema.validate({
          orderDate: values.orderDate,
          customerName: values.customerName,
          notes: values.notes,
          items: itemsFormatted,
        }, { abortEarly: false });
      } catch (err: any) {
        return getValidationErrorMap(err);
      }
    },
    onSubmit: async (values) => {
      try {
        const itemsFiltered = values.items.filter(item => item.menuId && item.quantity > 0);
        const formattedItems = itemsFiltered.map(i => ({
          menuId: i.menuId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          customPrice: i.customPrice,
          notes: null,
          excludedIngredients: i.excludedIngredients || [],
          sugarLevel: i.sugarLevel || 'NORMAL',
          extras: (i.extras || []).filter(ex => ex.menuId && ex.quantity > 0).map(ex => ({
            menuId: ex.menuId,
            quantity: ex.quantity,
            unitPrice: ex.unitPrice,
            customPrice: null,
            notes: null,
          })),
        }));

        const payload = {
          orderDate: values.orderDate,
          customerName: values.customerName,
          notes: values.notes,
          items: formattedItems,
        };

        if (editingOrder) {
          await ordersApi.update(editingOrder.id, payload);
          toast.success('Pesanan berhasil diperbarui');
        } else {
          await ordersApi.create(payload);
          toast.success('Pesanan berhasil dicatat');
        }

        setShowAddOrder(false);
        setEditingOrder(null);
        formik.resetForm();
        fetchData();
      } catch (err: any) {
        toast.error(err.message);
      }
    },
  });

  const getAdjustedIngredientsForIndex = (parentIndex: number, extraIndex?: number) => {
    const adjustedStocks = new Map<string, number>();
    for (const ing of ingredients) {
      adjustedStocks.set(ing.id, Number(ing.availableStock ?? ing.currentStock));
    }

    formik.values.items.forEach((item, pIdx) => {
      const isCurrentParent = pIdx === parentIndex;
      
      if (!isCurrentParent && item.menuId) {
        const menu = menus.find((m) => m.id === item.menuId);
        if (menu) {
          const qty = Number(item.quantity) || 0;
          const excludedIds = item.excludedIngredients || [];
          const sugarLevel = item.sugarLevel || 'NORMAL';

          menu.recipes?.forEach((r) => {
            if (r.optional) return;
            if (excludedIds.includes(r.ingredientId)) return;

            let qtyUsed = Number(r.quantity);
            if (r.ingredient?.name?.toLowerCase().includes('gula') && sugarLevel === 'LESS') {
              if (r.lessSugarQuantity !== null && r.lessSugarQuantity !== undefined) {
                qtyUsed = Number(r.lessSugarQuantity);
              } else {
                const nameLower = menu.name.toLowerCase();
                if (nameLower.includes('kopi susu') || nameLower.includes('kopsus')) {
                  qtyUsed = 10;
                } else if (nameLower.includes('hazelnut') || nameLower.includes('pandan')) {
                  qtyUsed = 5;
                }
              }
            }

            const totalNeeded = qtyUsed * qty;
            const currentStock = adjustedStocks.get(r.ingredientId) || 0;
            adjustedStocks.set(r.ingredientId, Math.max(0, currentStock - totalNeeded));
          });
        }
      }

      item.extras?.forEach((extra, eIdx) => {
        const isCurrentExtra = isCurrentParent && eIdx === extraIndex;
        
        if (!isCurrentExtra && extra.menuId) {
          const extMenu = menus.find((m) => m.id === extra.menuId);
          if (extMenu) {
            const extQty = Number(extra.quantity) || 0;
            extMenu.recipes?.forEach((r) => {
              if (r.optional) return;
              const totalNeeded = Number(r.quantity) * extQty;
              const currentStock = adjustedStocks.get(r.ingredientId) || 0;
              adjustedStocks.set(r.ingredientId, Math.max(0, currentStock - totalNeeded));
            });
          }
        }
      });
    });

    return adjustedStocks;
  };

  const getMenuPortionsForIndex = (menu: MenuItem, index: number) => {
    const requiredRecipes = menu.recipes?.filter((r) => !r.optional) || [];
    if (requiredRecipes.length === 0) return { portions: 0, hasNoRecipe: true };

    const adjustedStocks = getAdjustedIngredientsForIndex(index);
    let minPortions = Infinity;

    for (const recipe of requiredRecipes) {
      const stock = adjustedStocks.get(recipe.ingredientId) || 0;
      let quantityNeeded = Number(recipe.quantity);
      
      const item = formik.values.items[index];
      if (item && item.menuId === menu.id) {
        if (item.excludedIngredients?.includes(recipe.ingredientId)) {
          quantityNeeded = 0;
        } else if (item.sugarLevel === 'LESS' && recipe.ingredient?.name?.toLowerCase().includes('gula')) {
          if (recipe.lessSugarQuantity !== null && recipe.lessSugarQuantity !== undefined) {
            quantityNeeded = Number(recipe.lessSugarQuantity);
          } else {
            const nameLower = menu.name.toLowerCase();
            if (nameLower.includes('kopi susu') || nameLower.includes('kopsus')) {
              quantityNeeded = 10;
            } else if (nameLower.includes('hazelnut') || nameLower.includes('pandan')) {
              quantityNeeded = 5;
            }
          }
        }
      }

      if (quantityNeeded <= 0) continue;

      const portions = Math.floor(stock / quantityNeeded);
      if (portions < minPortions) {
        minPortions = portions;
      }
    }

    return {
      portions: minPortions === Infinity ? 0 : minPortions,
      hasNoRecipe: false
    };
  };

  const getExtraPortionsForIndex = (extraMenu: MenuItem, parentIndex: number, extraIndex: number) => {
    const requiredRecipes = extraMenu.recipes?.filter((r) => !r.optional) || [];
    if (requiredRecipes.length === 0) return { portions: 0, hasNoRecipe: true };

    const adjustedStocks = getAdjustedIngredientsForIndex(parentIndex, extraIndex);
    let minPortions = Infinity;

    for (const recipe of requiredRecipes) {
      const stock = adjustedStocks.get(recipe.ingredientId) || 0;
      const quantityNeeded = Number(recipe.quantity);

      if (quantityNeeded <= 0) continue;

      const portions = Math.floor(stock / quantityNeeded);
      if (portions < minPortions) {
        minPortions = portions;
      }
    }

    return {
      portions: minPortions === Infinity ? 0 : minPortions,
      hasNoRecipe: false
    };
  };

  const handleOpenCreate = () => {
    setEditingOrder(null);
    formik.setValues({
      orderDate: new Date().toISOString().split('T')[0],
      customerName: '',
      notes: '',
      items: [{ menuId: '', quantity: 1, unitPrice: 0, customPrice: null, excludedIngredients: [], sugarLevel: 'NORMAL', extras: [] }],
    });
    setShowAddOrder(true);
  };

  const handleOpenEdit = (order: Order) => {
    setEditingOrder(order);
    
    // Filter parent items (tidak memiliki parentItemId)
    const parents = order.items.filter(item => !item.parentItemId);
    const formItems = parents.map(p => {
      const parentExtras = order.items.filter(item => item.parentItemId === p.id);
      return {
        menuId: p.menuId || '',
        quantity: Number(p.quantity),
        unitPrice: Number(p.unitPrice),
        customPrice: p.customPrice !== null ? Number(p.customPrice) : null,
        excludedIngredients: p.excludedIngredients || [],
        sugarLevel: p.sugarLevel || 'NORMAL',
        extras: parentExtras.map(ex => ({
          menuId: ex.menuId || '',
          quantity: Number(ex.quantity),
          unitPrice: Number(ex.unitPrice),
        })),
      };
    });

    formik.setValues({
      orderDate: order.orderDate.split('T')[0],
      customerName: order.customerName || '',
      notes: order.notes || '',
      items: formItems.length > 0 ? formItems : [{ menuId: '', quantity: 1, unitPrice: 0, customPrice: null, excludedIngredients: [], sugarLevel: 'NORMAL', extras: [] }],
    });
    setShowAddOrder(true);
  };

  const handleCompleteOrder = async (id: string) => {
    try {
      await ordersApi.complete(id, {
        paymentMethod: completePaymentMethod,
        paymentStatus: completePaymentStatus,
        resolvedAt: completeResolvedAt,
        notes: completeNotes,
      });
      toast.success('Pesanan berhasil diselesaikan');
      setCompletingOrderId(null);
      setCompletePaymentMethod('Cash');
      setCompletePaymentStatus('LUNAS');
      setCompleteResolvedAt(new Date().toISOString().split('T')[0]);
      setCompleteNotes('');
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await ordersApi.delete(id);
      toast.success('Pesanan berhasil dibatalkan/dihapus');
      setDeletingOrderId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const pendingOrders = orders.filter(o => o.status === 'PENDING');

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Catatan Pemesanan</h1>
          <p className="text-ink-secondary text-xs mt-1">Kelola pesanan pelanggan yang masuk.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <span className="hidden md:inline"> Buat Pesanan Baru</span>
        </Button>
      </div>

      {/* Pending Orders Section */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5">
          <Clock size={14} className="text-warning" />
          Pesanan Aktif
        </h2>

        {pendingOrders.length > 0 ? (
          <>
            {/* Mobile View (Cards) */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {pendingOrders.map((order) => {
                const totalBill = order.items.reduce((sum, item) => sum + Number(item.finalPrice), 0);
                const itemsText = order.items
                  .filter((i) => !i.parentItemId)
                  .map((i) => {
                    const itemExtras = order.items.filter((e) => e.parentItemId === i.id);
                    const extrasText = itemExtras.length > 0 
                      ? ` (+ ${itemExtras.map(ex => `${ex.quantity}x ${ex.menu?.name || 'Extra'}`).join(', ')})`
                      : '';
                    const fullMenu = menus.find(m => m.id === i.menuId);
                    const isSugarExcluded = fullMenu?.recipes?.some(
                      (r) => r.ingredient?.name?.toLowerCase().includes('gula') && i.excludedIngredients?.includes(r.ingredientId)
                    );
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
                  <div key={order.id} className="bg-surface border border-border p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-ink truncate flex items-center gap-1.5">
                          <User size={13} className="text-ink-faint" />
                          {order.customerName || 'Anonim'}
                        </p>
                        <p className="text-[10px] text-ink-muted font-mono mt-0.5">{formatDate(order.orderDate)}</p>
                      </div>
                      <span className="font-bold text-xs text-ink font-mono">{formatRupiah(totalBill)}</span>
                    </div>
                    
                    <div className="text-xs text-ink-secondary bg-surface-soft p-2.5 rounded-lg border border-border">
                      <span className="font-semibold text-ink">Pesanan: </span>
                      {itemsText}
                    </div>

                    {order.notes && (
                      <p 
                        onClick={() => setViewNotes(order.notes || null)}
                        className="text-[11px] text-ink-secondary italic cursor-pointer hover:underline bg-surface-soft/50 p-2 rounded border border-border/50 truncate"
                      >
                        Note: {order.notes}
                      </p>
                    )}

                    <div className="flex gap-2 justify-end pt-1">
                      <button 
                        onClick={() => handleOpenEdit(order)}
                        className="flex-1 text-ink-secondary hover:text-ink bg-surface border border-border hover:bg-surface-soft p-2 cursor-pointer transition flex items-center justify-center gap-1 text-xs rounded-lg"
                      >
                        <Edit2 size={12} />
                        Edit
                      </button>
                      <button 
                        onClick={() => setCompletingOrderId(order.id)}
                        className="flex-1 text-success hover:text-success-strong p-2 cursor-pointer transition flex items-center justify-center gap-1 text-xs bg-success/10 border border-success/20 rounded-lg"
                      >
                        <CheckCircle2 size={13} />
                        Selesaikan
                      </button>
                      <button 
                        onClick={() => setDeletingOrderId(order.id)}
                        className="p-2 text-ink-faint hover:text-error bg-surface-soft border border-border rounded-lg cursor-pointer transition"
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
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Item Pesanan</TableHead>
                  <TableHead align="right">Estimasi Tagihan</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead align="right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingOrders.map((order) => {
                  const totalBill = order.items.reduce((sum, item) => sum + Number(item.finalPrice), 0);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="whitespace-nowrap font-mono text-ink-muted">{formatDate(order.orderDate)}</TableCell>
                      <TableCell className="font-semibold text-ink whitespace-nowrap flex items-center gap-1.5">
                        <User size={13} className="text-ink-faint" />
                        {order.customerName || 'Anonim'}
                      </TableCell>
                      <TableCell className="text-ink">
                        {order.items
                          .filter((i) => !i.parentItemId)
                          .map((i) => {
                            const itemExtras = order.items.filter((e) => e.parentItemId === i.id);
                            const extrasText = itemExtras.length > 0 
                              ? ` (+ ${itemExtras.map(ex => `${ex.quantity}x ${ex.menu?.name || 'Extra'}`).join(', ')})`
                              : '';
                            const fullMenu = menus.find(m => m.id === i.menuId);
                            const isSugarExcluded = fullMenu?.recipes?.some(
                              (r) => r.ingredient?.name?.toLowerCase().includes('gula') && i.excludedIngredients?.includes(r.ingredientId)
                            );
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
                      <TableCell align="right" className="font-bold text-ink font-mono">{formatRupiah(totalBill)}</TableCell>
                      <TableCell 
                        className={`text-ink-secondary text-[11px] italic max-w-[200px] truncate ${order.notes ? 'cursor-pointer hover:underline hover:text-ink' : ''}`}
                        title={order.notes ? "Klik untuk melihat catatan lengkap" : "Tidak ada catatan"}
                        onClick={() => order.notes && setViewNotes(order.notes)}
                      >
                        {order.notes ? order.notes.split(/\r?\n/).map(l => l.trim()).filter(Boolean).join(' • ') : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleOpenEdit(order)}
                            className="text-ink-secondary hover:text-ink bg-surface border border-border hover:bg-surface-soft p-1 cursor-pointer transition flex items-center gap-1 text-xs rounded px-2"
                            title="Edit Pesanan"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                          <button 
                            onClick={() => setCompletingOrderId(order.id)}
                            className="text-success hover:text-success-strong p-1 cursor-pointer transition flex items-center gap-1 text-xs bg-success-soft hover:bg-success-soft/80 border border-success/20 rounded px-2"
                            title="Selesaikan & Bayar"
                          >
                            <CheckCircle2 size={13} />
                            Selesaikan
                          </button>
                          <button 
                            onClick={() => setDeletingOrderId(order.id)}
                            className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                            title="Batalkan Pesanan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </>
        ) : (
          <div className="bg-surface border border-border rounded-xl text-center py-10 px-6 space-y-2">
            <p className="text-xs text-ink-muted">Tidak ada pesanan aktif saat ini.</p>
          </div>
        )}
      </div>

      {/* Add/Edit Order Modal */}
      <Modal
        isOpen={showAddOrder}
        onClose={() => {
          setShowAddOrder(false);
          formik.resetForm();
        }}
        title={editingOrder ? "Edit Catatan Pesanan" : "Buat Pesanan Baru (Tunda)"}
        description={editingOrder ? "Ubah detail item, qty, modifikasi resep, maupun request tambahan untuk pesanan ini." : "Catat pesanan tunda terlebih dahulu. Stok bahan baku belum akan dikurangi sampai pesanan diselesaikan."}
        maxWidth="2xl"
      >
        <form onSubmit={formik.handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Tanggal Pesanan"
              type="date"
              name="orderDate"
              value={formik.values.orderDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.orderDate ? formik.errors.orderDate : undefined}
            />
            <Input 
              label="Nama Pelanggan"
              type="text"
              name="customerName"
              placeholder="Masukkan nama pelanggan"
              value={formik.values.customerName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.customerName ? formik.errors.customerName : undefined}
            />
          </div>

          <div>
            <Textarea 
              label="Catatan Khusus (Request per Orang)"
              name="notes"
              placeholder={`Contoh:\nMeja 4\nOrang 1: Es kopi less sugar\nOrang 2: Matcha latte`}
              value={formik.values.notes || ''}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-ink-muted">Item Pesanan</label>
                {formik.touched.items && typeof formik.errors.items === 'string' && (
                  <p className="text-[10px] text-error mt-0.5">{formik.errors.items}</p>
                )}
              </div>
              <button 
                type="button"
                onClick={() => formik.setFieldValue('items', [
                  ...formik.values.items,
                  { menuId: '', quantity: 1, unitPrice: 0, customPrice: null, excludedIngredients: [], sugarLevel: 'NORMAL', extras: [] }
                ])}
                className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
              >
                + Tambah Item
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {formik.values.items.map((item, index) => {
                const itemTouched = formik.touched.items?.[index];
                const itemError = formik.errors.items?.[index] as any;

                return (
                  <div key={index} className="bg-surface-soft p-4 rounded-lg border border-border space-y-3">
                    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-start">
                      <div className="w-full md:flex-1">
                        <Select 
                          label="Pilih Menu"
                          value={item.menuId}
                          onChange={(e) => {
                            const copy = [...formik.values.items];
                            copy[index].menuId = e.target.value;
                            const m = mainMenus.find(menu => menu.id === e.target.value);
                            if (m) {
                              copy[index].unitPrice = Number(m.price || m.defaultSellingPrice || 0);
                              copy[index].customPrice = null;
                              copy[index].excludedIngredients = [];
                              copy[index].sugarLevel = 'NORMAL';
                            }
                            formik.setFieldValue('items', copy);
                          }}
                          error={itemTouched?.menuId ? itemError?.menuId : undefined}
                          required
                        >
                          <option value="">Pilih Menu Utama</option>
                          {mainMenus.map((m) => {
                            const { portions, hasNoRecipe } = getMenuPortionsForIndex(m, index);
                            const isOut = !hasNoRecipe && portions === 0;
                            return (
                              <option key={m.id} value={m.id}>
                                {isOut ? `[HABIS] ` : ''}{m.name} ({formatRupiah(m.price || m.defaultSellingPrice || 0)})
                              </option>
                            );
                          })}
                        </Select>
                        {item.menuId && (() => {
                          const m = mainMenus.find(menu => menu.id === item.menuId);
                          if (!m) return null;
                          const { portions, hasNoRecipe } = getMenuPortionsForIndex(m, index);
                          
                          if (hasNoRecipe) {
                            return (
                              <p className="text-[10px] text-ink-muted mt-1 font-medium">
                                ℹ️ Resep belum dikonfigurasi
                              </p>
                            );
                          }

                          const isOver = item.quantity > portions;
                          return (
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-sans">
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                                portions === 0 
                                  ? 'bg-error/10 border-error/20 text-error' 
                                  : portions <= 5 
                                    ? 'bg-warning/10 border-warning/20 text-warning' 
                                    : 'bg-success/10 border-success/20 text-success'
                              }`}>
                                {portions === 0 ? 'Stok Habis' : `${portions} Porsi Tersedia`}
                              </span>
                              
                              {isOver && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold border bg-error/15 border-error/30 text-error animate-pulse">
                                  Qty Melebihi Stok
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex gap-2 w-full md:w-auto items-end">
                        <div className="flex-1 md:w-32">
                          <RupiahInput 
                            label="Harga Jual"
                            value={item.customPrice !== null && item.customPrice !== undefined ? item.customPrice : item.unitPrice}
                            onChange={(val) => {
                              const copy = [...formik.values.items];
                              copy[index].customPrice = val;
                              formik.setFieldValue('items', copy);
                            }}
                            className="text-right"
                            required
                          />
                        </div>
                        
                        <div className="w-20">
                          <Input 
                            label="Qty"
                            type="number" 
                            value={item.quantity || ''}
                            onChange={(e) => {
                              const copy = [...formik.values.items];
                              copy[index].quantity = Number(e.target.value);
                              formik.setFieldValue('items', copy);
                            }}
                            error={itemTouched?.quantity ? itemError?.quantity : undefined}
                            className="text-center"
                            min={1}
                            required
                          />
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            formik.setFieldValue(
                              'items',
                              formik.values.items.filter((_, i) => i !== index),
                            );
                          }}
                          className="text-ink-faint hover:text-error p-2.5 cursor-pointer transition shrink-0 mb-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Recipe Exclusions & Sugar Level Selector */}
                    {item.menuId && (() => {
                      const m = mainMenus.find(menu => menu.id === item.menuId);
                      if (m && m.recipes && m.recipes.length > 0) {
                        const sugarRecipe = m.recipes.find(r => r.ingredient?.name?.toLowerCase().includes('gula'));
                        const otherRecipes = m.recipes.filter(r => !r.ingredient?.name?.toLowerCase().includes('gula'));
                        
                        let selectedSugarValue = 'NORMAL';
                        if (sugarRecipe && item.excludedIngredients?.includes(sugarRecipe.ingredientId)) {
                          selectedSugarValue = 'NONE';
                        } else if (item.sugarLevel === 'LESS') {
                          selectedSugarValue = 'LESS';
                        }

                        return (
                          <div className="bg-surface p-3 rounded-lg border border-border space-y-3">
                            {sugarRecipe && (
                              <div className="border-b border-border/50 pb-2">
                                <label className="block text-[10px] font-bold text-ink-secondary uppercase tracking-wider mb-1.5">
                                  Level Gula:
                                </label>
                                <select
                                  value={selectedSugarValue}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const copy = [...formik.values.items];
                                    const currentExclusions = copy[index].excludedIngredients || [];
                                    
                                    if (val === 'NONE') {
                                      copy[index].excludedIngredients = Array.from(new Set([...currentExclusions, sugarRecipe.ingredientId]));
                                      copy[index].sugarLevel = 'NORMAL';
                                    } else if (val === 'LESS') {
                                      copy[index].excludedIngredients = currentExclusions.filter(id => id !== sugarRecipe.ingredientId);
                                      copy[index].sugarLevel = 'LESS';
                                    } else {
                                      copy[index].excludedIngredients = currentExclusions.filter(id => id !== sugarRecipe.ingredientId);
                                      copy[index].sugarLevel = 'NORMAL';
                                    }
                                    formik.setFieldValue('items', copy);
                                  }}
                                  className="w-full bg-surface border border-border rounded p-1.5 text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-medium"
                                >
                                  <option value="NORMAL">Normal Sugar</option>
                                  <option value="LESS">Less Sugar</option>
                                  <option value="NONE">No Sugar</option>
                                </select>
                              </div>
                            )}

                            {otherRecipes.length > 0 && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-ink-secondary block">
                                  Modifikasi Resep (Bahan Baku Aktif):
                                </span>
                                <div className="flex flex-wrap gap-x-4 gap-y-2">
                                  {otherRecipes.map((r) => {
                                    if (!r.ingredient) return null;
                                    const isExcluded = item.excludedIngredients?.includes(r.ingredientId);
                                    return (
                                      <label key={r.id} className="flex items-center gap-2 text-xs text-ink cursor-pointer hover:opacity-80">
                                        <input 
                                          type="checkbox"
                                          checked={!isExcluded}
                                          onChange={(e) => {
                                            const copy = [...formik.values.items];
                                            const currentExclusions = copy[index].excludedIngredients || [];
                                            if (e.target.checked) {
                                              copy[index].excludedIngredients = currentExclusions.filter(id => id !== r.ingredientId);
                                            } else {
                                              copy[index].excludedIngredients = [...currentExclusions, r.ingredientId];
                                            }
                                            formik.setFieldValue('items', copy);
                                          }}
                                          className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                                        />
                                        <span>{r.ingredient.name}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Extras / Add-ons */}
                    {item.menuId && addonMenus.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">Extra / Add-ons:</span>
                          <button 
                            type="button"
                            onClick={() => {
                              const copy = [...formik.values.items];
                              const ext = copy[index].extras || [];
                              copy[index].extras = [...ext, { menuId: '', quantity: 1, unitPrice: 0 }];
                              formik.setFieldValue('items', copy);
                            }}
                            className="text-[9px] text-link hover:underline font-semibold cursor-pointer"
                          >
                            + Tambah Extra
                          </button>
                        </div>

                        {item.extras && item.extras.length > 0 && (
                          <div className="space-y-2 pl-4 border-l border-border mt-1">
                            {item.extras.map((extra, extIndex) => (
                              <div key={extIndex} className="flex gap-2 items-center">
                                <div className="flex-1">
                                  <Select 
                                    value={extra.menuId}
                                    onChange={(e) => {
                                      const copy = [...formik.values.items];
                                      const extCopy = [...(copy[index].extras || [])];
                                      extCopy[extIndex].menuId = e.target.value;
                                      const extMenu = addonMenus.find(am => am.id === e.target.value);
                                      if (extMenu) {
                                        extCopy[extIndex].unitPrice = Number(extMenu.price || extMenu.defaultSellingPrice || 0);
                                      }
                                      copy[index].extras = extCopy;
                                      formik.setFieldValue('items', copy);
                                    }}
                                    required
                                  >
                                    <option value="">Pilih Extra</option>
                                    {addonMenus.map((am) => {
                                      const { portions, hasNoRecipe } = getExtraPortionsForIndex(am, index, extIndex);
                                      const isOut = !hasNoRecipe && portions === 0;
                                      return (
                                        <option key={am.id} value={am.id}>
                                          {isOut ? `[HABIS] ` : ''}{am.name} ({formatRupiah(am.price || am.defaultSellingPrice || 0)})
                                        </option>
                                      );
                                    })}
                                  </Select>
                                  {extra.menuId && (() => {
                                    const am = addonMenus.find(menu => menu.id === extra.menuId);
                                    if (!am) return null;
                                    const { portions, hasNoRecipe } = getExtraPortionsForIndex(am, index, extIndex);
                                    
                                    if (hasNoRecipe) {
                                      return (
                                        <p className="text-[9px] text-ink-muted mt-1 font-medium">
                                          ℹ️ Resep belum dikonfigurasi
                                        </p>
                                      );
                                    }

                                    const isOver = extra.quantity > portions;
                                    return (
                                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-sans">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-semibold border ${
                                          portions === 0 
                                            ? 'bg-error/10 border-error/20 text-error' 
                                            : portions <= 5 
                                              ? 'bg-warning/10 border-warning/20 text-warning' 
                                              : 'bg-success/10 border-success/20 text-success'
                                        }`}>
                                          {portions === 0 ? 'Stok Habis' : `${portions} Porsi Tersedia`}
                                        </span>
                                        
                                        {isOver && (
                                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold border bg-error/15 border-error/30 text-error animate-pulse">
                                            Qty Melebihi Stok
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                                <div className="w-20">
                                  <Input 
                                    type="number" 
                                    value={extra.quantity || ''}
                                    onChange={(e) => {
                                      const copy = [...formik.values.items];
                                      const extCopy = [...(copy[index].extras || [])];
                                      extCopy[extIndex].quantity = Number(e.target.value);
                                      copy[index].extras = extCopy;
                                      formik.setFieldValue('items', copy);
                                    }}
                                    className="text-center"
                                    min={1}
                                    required
                                  />
                                </div>

                                <button 
                                  type="button"
                                  onClick={() => {
                                    const copy = [...formik.values.items];
                                    const extCopy = (copy[index].extras || []).filter((_, i) => i !== extIndex);
                                    copy[index].extras = extCopy;
                                    formik.setFieldValue('items', copy);
                                  }}
                                  className="text-ink-faint hover:text-error p-1 cursor-pointer transition"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button variant="secondary" type="button" onClick={() => {
              setShowAddOrder(false);
              formik.resetForm();
            }}>
              Batal
            </Button>
            <Button type="submit" disabled={formik.isSubmitting}>
              {editingOrder ? "Simpan Perubahan" : "Simpan Pesanan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Notes Modal */}
      <Modal
        isOpen={viewNotes !== null}
        onClose={() => setViewNotes(null)}
        title="Catatan Lengkap Pesanan"
        description="Detail instruksi khusus atau request dari pelanggan untuk pesanan ini."
        maxWidth="md"
      >
        <div className="bg-surface-soft border border-border p-4 rounded-lg text-xs leading-relaxed text-ink font-medium">
          {(() => {
            const lines = viewNotes ? viewNotes.split(/\r?\n/).map(l => l.trim()).filter(Boolean) : [];
            if (lines.length === 0) return <p className="text-ink-muted italic">Tidak ada catatan</p>;
            return (
              <ul className="list-disc pl-4 space-y-1">
                {lines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            );
          })()}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={() => setViewNotes(null)}>
            Tutup
          </Button>
        </div>
      </Modal>

      {/* Custom Modal Selesaikan Pesanan */}
      {(() => {
        const orderToComplete = orders.find(o => o.id === completingOrderId);
        let totalBill = 0;
        let estimatedHpp = 0;
        if (orderToComplete) {
          totalBill = orderToComplete.items.reduce((sum, item) => sum + Number(item.finalPrice), 0);
          estimatedHpp = orderToComplete.items.reduce((sum, item) => {
            const menu = menus.find(m => m.id === item.menuId);
            const hpp = menu ? Number(menu.hpp || 0) : 0;
            return sum + (hpp * Number(item.quantity));
          }, 0);
        }

        return (
          <Modal
            isOpen={completingOrderId !== null}
            onClose={() => {
              setCompletingOrderId(null);
              setCompletePaymentMethod('Cash');
              setCompletePaymentStatus('LUNAS');
              setCompleteResolvedAt(new Date().toISOString().split('T')[0]);
              setCompleteNotes('');
            }}
            title="Selesaikan & Bayar Pesanan"
            description="Konfirmasi detail pembayaran dan selesaikan pesanan ini. Stok bahan baku fisik akan dikurangi secara otomatis."
            maxWidth="lg"
          >
            {orderToComplete && (
              <div className="space-y-4 font-sans text-xs">
                <div className="bg-surface-soft p-3.5 rounded-lg border border-border space-y-2">
                  <h4 className="font-bold text-[9px] uppercase tracking-wider text-ink-muted">Detail Item Pesanan</h4>
                  <div className="divide-y divide-border/60">
                    {orderToComplete.items.filter(item => !item.parentItemId).map((item) => {
                      const itemExtras = orderToComplete.items.filter(e => e.parentItemId === item.id);
                      return (
                        <div key={item.id} className="py-2 flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-ink">{Number(item.quantity)}x</span> {item.menu?.name || 'Item Kustom'}
                            {item.sugarLevel === 'LESS' && <span className="text-[10px] text-ink-muted"> (Less Sugar)</span>}
                            {itemExtras.length > 0 && (
                              <span className="block text-[10px] text-ink-muted">
                                Extras: {itemExtras.map(ex => `${ex.quantity}x ${ex.menu?.name}`).join(', ')}
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-ink font-semibold">{formatRupiah(item.finalPrice + itemExtras.reduce((s, ex) => s + Number(ex.finalPrice), 0))}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-2 border-t border-border flex justify-between text-xs">
                    <span className="font-bold">Total Tagihan:</span>
                    <span className="font-bold font-mono text-primary">{formatRupiah(totalBill)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-ink-secondary font-mono">
                    <span>Estimasi HPP:</span>
                    <span>{formatRupiah(estimatedHpp)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Metode Pembayaran"
                    value={completePaymentMethod}
                    onChange={(e) => setCompletePaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash</option>
                    <option value="BCA">BCA</option>
                    <option value="Transfer lainnya">Transfer Lainnya</option>
                  </Select>

                  <Select
                    label="Status Pembayaran"
                    value={completePaymentStatus}
                    onChange={(e) => setCompletePaymentStatus(e.target.value)}
                  >
                    <option value="LUNAS">Lunas</option>
                    <option value="BELUM_DIBAYAR">Belum dibayar</option>
                  </Select>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Tanggal Pembayaran"
                    type="date"
                    value={completeResolvedAt}
                    onChange={(e) => setCompleteResolvedAt(e.target.value)}
                  />
                  <Input
                    label="Catatan Khusus Selesai (Opsional)"
                    type="text"
                    placeholder="Catatan tambahan pembayaran/penyelesaian"
                    value={completeNotes}
                    onChange={(e) => setCompleteNotes(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setCompletingOrderId(null);
                      setCompletePaymentMethod('Cash');
                      setCompletePaymentStatus('LUNAS');
                      setCompleteResolvedAt(new Date().toISOString().split('T')[0]);
                      setCompleteNotes('');
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => handleCompleteOrder(orderToComplete.id)}
                  >
                    Selesaikan Pesanan
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        );
      })()}

      {/* Confirm Batalkan Pesanan */}
      <ConfirmModal
        isOpen={deletingOrderId !== null}
        onClose={() => setDeletingOrderId(null)}
        onConfirm={() => deletingOrderId && handleDeleteOrder(deletingOrderId)}
        title="Batalkan & Hapus Pesanan?"
        description="Apakah Anda yakin ingin membatalkan dan menghapus pesanan tunda ini secara permanen?"
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
