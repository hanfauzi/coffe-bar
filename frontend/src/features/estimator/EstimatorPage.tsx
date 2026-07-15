import {
  AlertTriangle,
  CheckCircle2,
  Coffee,
  DollarSign,
  Info,
  Plus,
  Trash2,
  XCircle
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { formatRupiah } from '../../utils/helpers';
import type { Ingredient } from '../ingredients/types';
import type { MenuItem } from '../menus/types';

interface EstimatorPageProps {
  ingredients: Ingredient[];
  menus: MenuItem[];
}

interface SimulatedItem {
  id: string; // Unique simulation entry ID
  menuId: string;
  quantity: number;
}

export default function EstimatorPage({ ingredients, menus }: EstimatorPageProps) {
  const [simulatedItems, setSimulatedItems] = useState<SimulatedItem[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [inputQuantity, setInputQuantity] = useState<number>(1);

  // Filter available menus (that have recipes configured)
  const availableMenus = (menus || []).filter(m => m.active && m.recipes && m.recipes.length > 0);

  // Add menu to simulation
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenuId) return;

    const qty = Number(inputQuantity);
    if (isNaN(qty) || qty <= 0) return;

    // Check if menu is already in simulation list
    const existingIndex = simulatedItems.findIndex(item => item.menuId === selectedMenuId);
    if (existingIndex > -1) {
      const updated = [...simulatedItems];
      updated[existingIndex].quantity += qty;
      setSimulatedItems(updated);
    } else {
      setSimulatedItems([
        ...simulatedItems,
        {
          id: Date.now().toString(),
          menuId: selectedMenuId,
          quantity: qty,
        }
      ]);
    }

    // Reset inputs
    setSelectedMenuId('');
    setInputQuantity(1);
  };

  // Remove menu from simulation
  const handleRemoveItem = (id: string) => {
    setSimulatedItems(simulatedItems.filter(item => item.id !== id));
  };

  // Update item quantity directly
  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setSimulatedItems(
      simulatedItems.map(item => item.id === id ? { ...item, quantity: qty } : item)
    );
  };

  // Calculate cumulative ingredient requirements
  const ingredientRequirements: Record<string, { 
    name: string; 
    required: number; 
    stock: number; 
    unit: string; 
    latestUnitCost: number; 
    category: string;
  }> = {};

  simulatedItems.forEach(simItem => {
    const menu = menus.find(m => m.id === simItem.menuId);
    if (!menu || !menu.recipes) return;

    menu.recipes.forEach(recipe => {
      // Skip optional ingredients for minimum baseline estimation
      if (recipe.optional) return;

      const ingId = recipe.ingredientId;
      const ing = ingredients.find(i => i.id === ingId);
      const ingName = ing ? ing.name : 'Bahan tidak dikenal';
      const ingStock = ing ? Number(ing.currentStock) : 0;
      const ingUnit = ing ? ing.unit : recipe.unit;
      const ingCost = ing ? Number(ing.latestUnitCost) : 0;
      const ingCategory = ing ? ing.category : 'RAW_MATERIAL';

      const qtyNeeded = Number(recipe.quantity) * simItem.quantity;

      if (!ingredientRequirements[ingId]) {
        ingredientRequirements[ingId] = {
          name: ingName,
          required: 0,
          stock: ingStock,
          unit: ingUnit,
          latestUnitCost: ingCost,
          category: ingCategory
        };
      }
      ingredientRequirements[ingId].required += qtyNeeded;
    });
  });

  const requirementsList = Object.entries(ingredientRequirements).map(([id, req]) => ({
    id,
    ...req,
    deficit: Math.max(0, req.required - req.stock),
    isSufficient: req.stock >= req.required
  }));

  // Overall status check
  const totalItemsCount = simulatedItems.reduce((acc, item) => acc + item.quantity, 0);
  const hasDeficit = requirementsList.some(req => !req.isSufficient);
  
  // Total HPP calculation for simulated items
  const totalSimulatedCost = requirementsList.reduce((acc, req) => {
    return acc + (req.required * req.latestUnitCost);
  }, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Simulator Estimasi Bahan Baku</h1>
        <p className="text-ink-secondary text-xs mt-1">
          Simulasikan pembuatan kombinasi beberapa produk kopi/non-kopi sekaligus untuk memverifikasi kecukupan stok bahan baku secara real-time.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Products */}
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Coffee size={20} />
          </div>
          <div>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Total Produk Simulasi</p>
            <p className="text-lg font-bold text-ink mt-0.5">{totalItemsCount} porsi</p>
          </div>
        </div>

        {/* Total Estimated Cost / HPP */}
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Estimasi Biaya Bahan (HPP)</p>
            <p className="text-lg font-bold text-success mt-0.5">{formatRupiah(totalSimulatedCost)}</p>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-surface border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
          {totalItemsCount === 0 ? (
            <>
              <div className="p-3 bg-ink-muted/10 rounded-lg text-ink-muted">
                <Info size={20} />
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Status Produksi</p>
                <p className="text-xs font-semibold text-ink-secondary mt-0.5">Belum ada menu dimasukkan</p>
              </div>
            </>
          ) : !hasDeficit ? (
            <>
              <div className="p-3 bg-success/10 rounded-lg text-success">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Status Produksi</p>
                <p className="text-xs font-bold text-success mt-0.5">Stok Cukup (Dapat Diproduksi)</p>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-error/10 rounded-lg text-error">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] text-ink-muted uppercase tracking-wider font-bold">Status Produksi</p>
                <p className="text-xs font-bold text-error mt-0.5">Stok Kurang / Tidak Cukup</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form & Simulated Item List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border p-5 rounded-xl shadow-sm space-y-4">
            <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Tambah Menu ke Simulasi</h3>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <Select
                label="Pilih Menu"
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
              >
                <option value="">Pilih Menu Saji</option>
                {availableMenus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.category === 'ADDITIONAL' ? 'Extra' : 'Utama'})
                  </option>
                ))}
              </Select>

              <Input
                label="Jumlah Porsi"
                type="number"
                min={1}
                value={inputQuantity}
                onChange={(e) => setInputQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />

              <Button type="submit" className="w-full" disabled={!selectedMenuId}>
                <Plus size={14} className="mr-1.5" /> Tambah Simulasi
              </Button>
            </form>
          </div>

          {/* List of Simulated Items */}
          <div className="bg-surface border border-border p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Daftar Produk Simulasi</h3>
              {simulatedItems.length > 0 && (
                <button 
                  onClick={() => setSimulatedItems([])}
                  className="text-[10px] text-error hover:underline font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {simulatedItems.length > 0 ? (
              <div className="space-y-3">
                {simulatedItems.map((item) => {
                  const menu = menus.find(m => m.id === item.menuId);
                  if (!menu) return null;
                  return (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-surface-soft border border-border rounded-lg">
                      <div className="truncate pr-2">
                        <p className="text-xs font-semibold text-ink truncate">{menu.name}</p>
                        <p className="text-[9px] text-ink-muted">
                          HPP porsi: {formatRupiah(menu.hpp || 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center border border-border rounded bg-surface">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-ink hover:bg-surface-soft cursor-pointer font-bold"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold font-mono text-ink">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-ink hover:bg-surface-soft cursor-pointer font-bold"
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-ink-faint hover:text-error transition cursor-pointer"
                          title="Hapus dari simulasi"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-ink-muted text-xs italic">
                Belum ada produk yang disimulasikan. Tambahkan di atas.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Ingredient Feasibility Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-4">
            <div>
              <h3 className="font-bold text-xs text-ink uppercase tracking-wider">Analisis Kebutuhan Bahan Baku</h3>
              <p className="text-ink-secondary text-[11px] mt-0.5">
                Rincian total bahan baku yang diperlukan untuk memproduksi seluruh daftar menu simulasi di samping.
              </p>
            </div>

            {requirementsList.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Bahan</TableHead>
                      <TableHead align="right">Kebutuhan Total</TableHead>
                      <TableHead align="right">Stok Tersedia</TableHead>
                      <TableHead align="right">Selisih/Kekurangan</TableHead>
                      <TableHead align="center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requirementsList.map((req) => {
                      const colorClass = req.isSufficient ? 'text-success' : 'text-error';
                      return (
                        <TableRow key={req.id}>
                          <TableCell className="font-semibold text-ink">{req.name}</TableCell>
                          <TableCell align="right" className="font-mono text-ink font-semibold">
                            {req.required.toLocaleString('id-ID')} {req.unit}
                          </TableCell>
                          <TableCell align="right" className="font-mono text-ink-secondary">
                            {req.stock.toLocaleString('id-ID')} {req.unit}
                          </TableCell>
                          <TableCell align="right" className={`font-mono font-bold ${colorClass}`}>
                            {req.isSufficient ? (
                              <span className="text-[10px] text-success font-medium">Tercukupi</span>
                            ) : (
                              `-${req.deficit.toLocaleString('id-ID')} ${req.unit}`
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {req.isSufficient ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-success/20 bg-success/10 text-success text-[10px] font-medium font-mono">
                                <CheckCircle2 size={10} /> Cukup
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-error/20 bg-error/10 text-error text-[10px] font-bold font-mono">
                                <AlertTriangle size={10} /> Kurang
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border border-dashed border-border rounded-xl text-center py-16 text-xs text-ink-muted italic">
                Masukkan menu di samping untuk melihat analisis bahan baku.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
