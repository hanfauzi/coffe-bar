import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Coffee,
  HelpCircle,
  Package,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatRupiah } from '../../utils/helpers';
import type { Expense } from '../expenses/types';
import type { Ingredient } from '../ingredients/types';
import type { PersonalCup } from '../personal-cups/types';
import type { Sale } from '../sales/types';

interface ReportsPageProps {
  financials: any | null;
  ingredients: Ingredient[];
  sales: Sale[];
  expenses: Expense[];
  consumptions: PersonalCup[];
}

export default function ReportsPage({
  financials,
  ingredients = [],
  sales = [],
  expenses = [],
  consumptions = [],
}: ReportsPageProps) {
  const { toast } = useToast();
  
  const [localFinancials, setLocalFinancials] = useState<any>(financials);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [operationalBuffer, setOperationalBuffer] = useState(() => {
    const saved = localStorage.getItem('brewledger_operational_buffer');
    return saved ? Number(saved) : 100000;
  });

  const [staffMonthlyBudget, setStaffMonthlyBudget] = useState(() => {
    const saved = localStorage.getItem('brewledger_staff_monthly_budget');
    return saved ? Number(saved) : 100000;
  });

  useEffect(() => {
    setLocalFinancials(financials);
  }, [financials]);

  const handleApplyFilter = async () => {
    try {
      setLoading(true);
      const data = await api.reports.financials(startDate, endDate);
      setLocalFinancials(data);
      toast.success('Filter laporan berhasil diterapkan');
    } catch (err: any) {
      toast.error('Gagal menerapkan filter laporan');
    } finally {
      setLoading(false);
    }
  };

  const data = localFinancials?.financials;
  const inv = localFinancials?.inventory;
  const pc = localFinancials?.personalConsumption;

  const totalRevenue = data?.totalRevenue || 0;
  const totalHpp = data?.totalHpp || 0;
  const grossProfit = data?.grossProfit || 0;
  const operationalExpense = data?.operationalExpense || 0;
  const totalWasteCost = data?.totalWasteCost || 0;
  const netProfit = data?.netProfit || 0;
  
  const cashIn = data?.cashFlow?.cashIn ?? totalRevenue;
  const cashOutStock = data?.cashFlow?.cashOutStock ?? (data?.totalExpense || 0);
  const cashOutOther = data?.cashFlow?.cashOutOther ?? 0;
  const cashBalance = data?.cashFlow?.cashBalance ?? (totalRevenue - cashOutStock);
  
  const inventoryValuation = inv?.valuation || 0;
  const lowStockCount = inv?.lowStockItems || 0;
  
  // grossMargin = Gross Profit / Pendapatan * 100
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const estimasiRestockPrioritas = (ingredients || []).reduce((sum, ing) => {
    const curStock = Number(ing.currentStock);
    const availStock = Number(ing.availableStock ?? curStock);
    const minStock = Number(ing.minimumStock);
    const safetyStockVal = Number(ing.safetyStock || 0);
    
    const targetStock = safetyStockVal > 0 ? safetyStockVal : minStock;
    const recommendedQty = Math.max(0, targetStock - availStock);
    const unitCost = Number(ing.latestUnitCost || 0);
    
    const isPriority = availStock <= minStock;
    
    if (isPriority && recommendedQty > 0) {
      return sum + (recommendedQty * unitCost);
    }
    return sum;
  }, 0);

  const kasAmanDitarik = Math.max(0, cashBalance - estimasiRestockPrioritas - operationalBuffer);

  let healthStatus = 'Belum aman ditarik';
  let healthColor = 'bg-error/15 border-error/30 text-error';
  if (kasAmanDitarik > 200000) {
    healthStatus = 'Kas bisnis sehat';
    healthColor = 'bg-success/15 border-success/30 text-success';
  } else if (kasAmanDitarik > 0) {
    healthStatus = 'Aman ditarik sebagian';
    healthColor = 'bg-warning/15 border-warning/30 text-warning';
  }

  // Generate Trend Data for Chart
  const getTrendData = () => {
    let start = startDate ? new Date(startDate) : new Date();
    let end = endDate ? new Date(endDate) : new Date();
    
    if (!startDate) {
      start.setDate(start.getDate() - 30); // Default last 30 days
    }
    
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    
    const dataPoints: any[] = [];
    const temp = new Date(start);
    
    while (temp <= end) {
      const dateStr = temp.toISOString().split('T')[0];
      
      const daySales = sales.filter(s => s.date?.startsWith(dateStr));
      const dayExpenses = expenses.filter(e => e.date?.startsWith(dateStr));
      
      const revenue = daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
      const profit = daySales.reduce((sum, s) => sum + Number(s.grossProfit), 0);
      const cashOut = dayExpenses.reduce((sum, e) => sum + Number(e.totalCost), 0);
      
      dataPoints.push({
        dateLabel: temp.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        revenue,
        profit,
        cashFlow: revenue - cashOut,
      });
      
      temp.setDate(temp.getDate() + 1);
      if (dataPoints.length > 90) break; // limit to 90 days to avoid UI lag
    }
    
    return dataPoints;
  };

  const chartTrendData = getTrendData();

  // Aggregate Personal Consumption
  const consumptionByStaff: Record<string, { count: number, cost: number }> = {};
  const consumptionByProduct: Record<string, { count: number, cost: number }> = {};

  consumptions.forEach(c => {
    // filter by date if selected
    if (startDate || endDate) {
      const cDate = new Date(c.date);
      if (startDate && cDate < new Date(startDate)) return;
      if (endDate && cDate > new Date(endDate)) return;
    }

    const staff = c.staffName || 'Owner';
    const prod = c.menu?.name || 'Produk Kustom';
    const cost = Number(c.estimatedCost || 0);
    const qty = Number(c.quantity || 1);

    if (!consumptionByStaff[staff]) {
      consumptionByStaff[staff] = { count: 0, cost: 0 };
    }
    consumptionByStaff[staff].count += qty;
    consumptionByStaff[staff].cost += cost;

    if (!consumptionByProduct[prod]) {
      consumptionByProduct[prod] = { count: 0, cost: 0 };
    }
    consumptionByProduct[prod].count += qty;
    consumptionByProduct[prod].cost += cost;
  });

  const staffSummaryList = Object.entries(consumptionByStaff).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.cost - a.cost);
  const productSummaryList = Object.entries(consumptionByProduct).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.cost - a.cost);

  const showComparison = startDate && endDate && localFinancials?.comparison;
  const revChange = localFinancials?.comparison?.revenueChangePercent || 0;
  const profitChange = localFinancials?.comparison?.profitChangePercent || 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Laporan Keuangan & Analisis</h1>
          <p className="text-ink-secondary text-xs mt-1">Analisis ringkasan profitabilitas (akrual), arus kas (aktual), dan kesehatan bisnis kedai kopi.</p>
        </div>
        
        {/* Date Filter Bar */}
        <div className="flex flex-wrap items-end gap-3 bg-surface border border-border p-3 rounded-xl shadow-xs font-sans text-xs">
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1">Mulai Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-surface border border-border text-ink rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            />
          </div>
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-wider text-ink-muted mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-surface border border-border text-ink rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleApplyFilter} disabled={loading} className="px-3.5 py-1.5 h-8">
              {loading ? 'Filter...' : 'Filter'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setLocalFinancials(financials);
              }}
              disabled={loading}
              className="px-3.5 py-1.5 h-8"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* 1. Laba Rugi (Profit & Loss) */}
        <Card className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-primary">Laba Rugi (Profit & Loss)</h3>
              <TrendingUp size={14} className="text-primary" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Pendapatan (Sales)</span>
                <div className="text-right">
                  <span className="font-bold text-ink font-mono">{formatRupiah(totalRevenue)}</span>
                  {showComparison && (
                    <span className={`block text-[9px] font-bold font-sans ${revChange >= 0 ? 'text-success' : 'text-error'}`}>
                      {revChange >= 0 ? '▲' : '▼'} {Math.abs(revChange).toFixed(1)}% vs lalu
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">HPP Terpakai</span>
                <span className="font-semibold text-error font-mono">-{formatRupiah(totalHpp)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-2 font-bold text-ink">
                <span>Gross Profit</span>
                <div className="text-right">
                  <span className="text-success font-mono">{formatRupiah(grossProfit)}</span>
                  {showComparison && (
                    <span className={`block text-[9px] font-bold font-sans ${profitChange >= 0 ? 'text-success' : 'text-error'}`}>
                      {profitChange >= 0 ? '▲' : '▼'} {Math.abs(profitChange).toFixed(1)}% vs lalu
                    </span>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Kerugian Waste/Defect</span>
                <span className="font-semibold text-error font-mono">-{formatRupiah(totalWasteCost)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Biaya Operasional</span>
                <span className="font-semibold text-error font-mono">-{formatRupiah(operationalExpense)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-2.5 font-extrabold text-sm text-ink bg-surface-soft p-2.5 rounded-lg border">
                <span>Net Profit</span>
                <span className="text-success font-mono">{formatRupiah(netProfit)}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-ink-muted leading-tight border-t border-border/50 pt-2 mt-2">
            Belanja stok tidak langsung dikurangkan dari Laba Rugi karena masih menjadi aset di gudang.
          </div>
        </Card>

        {/* 2. Arus Kas (Cash Flow) */}
        <Card className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-focus">Arus Kas (Cash Flow)</h3>
              <Wallet size={14} className="text-focus" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Uang Masuk (Sales)</span>
                <span className="font-bold text-ink font-mono">{formatRupiah(cashIn)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Belanja Stok Bahan</span>
                <span className="font-semibold text-error font-mono">-{formatRupiah(cashOutStock)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Pengeluaran Lain</span>
                <span className="font-semibold text-error font-mono">-{formatRupiah(cashOutOther)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-2.5 font-extrabold text-sm text-ink bg-surface-soft p-2.5 rounded-lg border">
                <span>Saldo Kas</span>
                <span className={`${cashBalance >= 0 ? 'text-success' : 'text-error'} font-mono`}>
                  {formatRupiah(cashBalance)}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-ink-muted leading-tight border-t border-border/50 pt-2 mt-2">
            Arus kas bisa menipis jika uang tunai banyak digunakan untuk membeli stok bahan.
          </div>
        </Card>

        {/* 3. Nilai Aset Bahan Baku */}
        <Card className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-warning">Nilai Aset Bahan Baku</h3>
              <Package size={14} className="text-warning" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Jumlah Jenis Bahan</span>
                <span className="font-bold text-ink">{inv?.totalItems || 0} unit</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Level Stok Kritis</span>
                <span className="font-bold text-warning">{lowStockCount} bahan rendah</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-2.5 font-bold text-ink bg-surface-soft p-2.5 rounded-lg border">
                <span>Total Nilai Aset</span>
                <span className="text-warning font-mono">{formatRupiah(inventoryValuation)}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-ink-muted leading-relaxed border-t border-border/50 pt-2 mt-2">
            Nilai aset inventarisasi dihitung dari sisa stok dikalikan harga unit dari transaksi pembelian terakhir.
          </div>
        </Card>

        {/* 4. Nilai Konsumsi Pribadi */}
        <Card className="space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-border pb-2 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">Nilai Konsumsi Pribadi</h3>
              <Coffee size={14} className="text-ink-muted" />
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-ink-secondary">Total Minuman</span>
                <span className="font-bold text-ink">{pc?.count || 0} gelas</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-2.5 font-bold text-ink bg-surface-soft p-2.5 rounded-lg border">
                <span>Estimasi Biaya HPP</span>
                <span className="text-primary font-mono">{formatRupiah(pc?.estimatedCost || 0)}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-ink-muted leading-relaxed border-t border-border/50 pt-2 mt-2">
            Estimasi HPP dari konsumsi internal staff/pemilik kedai kopi tanpa menghasilkan omset penjualan tunai.
          </div>
        </Card>
      </div>

      {/* Visualisasi Tren Laporan Keuangan */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-4">
          <BarChart3 className="text-primary" size={16} />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Tren Keuangan Harian (Sales vs Cash Flow)
            </h3>
            <p className="text-[10px] text-ink-muted mt-0.5 font-medium">Tren grafik harian untuk mendeteksi perputaran kas riil.</p>
          </div>
        </div>

        <div className="h-64 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="dateLabel" stroke="var(--ink-muted)" fontSize={9} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--ink-muted)" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `Rp ${val >= 1000 ? (val/1000) + 'k' : val}`} />
              <Tooltip formatter={(value) => formatRupiah(Number(value))} />
              <Legend fontSize={9} />
              <Area type="monotone" dataKey="revenue" name="Omset Penjualan" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              <Area type="monotone" dataKey="cashFlow" name="Net Cash Flow" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 5. Kalkulator Kas Aman Ditarik */}
      <Card className="p-6 border border-border bg-surface shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary shrink-0" size={18} />
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Kalkulator Kas Aman Ditarik (Owner Withdrawals)</h2>
              <p className="text-[10px] text-ink-muted mt-0.5 font-medium">Estimasi dana kas dingin yang aman ditarik owner tanpa mengganggu operasional harian kedai.</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${healthColor}`}>
            {healthStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-sans text-xs">
          {/* Saldo Kas */}
          <div className="bg-surface-soft p-4 rounded-xl border border-border space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
              Saldo Kas Aktif
            </span>
            <p className="text-lg font-mono font-bold text-ink">{formatRupiah(cashBalance)}</p>
            <p className="text-[10px] text-ink-muted leading-tight">Total kas riil (pendapatan dikurangi pengeluaran).</p>
          </div>

          {/* Restock Prioritas */}
          <div className="bg-surface-soft p-4 rounded-xl border border-border space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
              Estimasi Restock Prioritas
            </span>
            <p className="text-lg font-mono font-bold text-error">-{formatRupiah(estimasiRestockPrioritas)}</p>
            <p className="text-[10px] text-ink-muted leading-tight">Cadangan belanja bahan kritis di bawah batas minimum.</p>
          </div>

          {/* Buffer Operasional */}
          <div className="bg-surface-soft p-4 rounded-xl border border-border space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-ink-muted">
              Buffer Operasional
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-sm font-bold text-ink">Rp</span>
              <input
                type="number"
                value={operationalBuffer}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setOperationalBuffer(val);
                  localStorage.setItem('brewledger_operational_buffer', String(val));
                }}
                className="w-full px-2 py-0.5 text-xs font-mono font-bold bg-surface border border-border rounded focus:outline-none focus:border-primary"
                min={0}
                step={50000}
              />
            </div>
            <p className="text-[10px] text-ink-muted leading-tight">Dana darurat cadangan laci kas toko.</p>
          </div>

          {/* Kas Aman Ditarik */}
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
              Kas Aman Ditarik
            </span>
            <p className="text-lg font-mono font-extrabold text-primary">{formatRupiah(kasAmanDitarik)}</p>
            <p className="text-[10px] text-ink-secondary leading-tight font-semibold">Dana dingin untuk diambil/dividen owner.</p>
          </div>
        </div>

        {/* Edukasi Penting */}
        <div className="bg-surface-soft p-4 rounded-xl border border-border grid grid-cols-1 md:grid-cols-3 gap-4 text-[10.5px] leading-relaxed text-ink-secondary font-medium">
          <div className="space-y-1 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <HelpCircle size={12} className="text-primary shrink-0" /> Gross Profit ≠ Kas
            </span>
            <p>Keuntungan kotor di atas kertas tidak mencerminkan uang tunai di laci, karena uang kas Anda mungkin sudah terpakai untuk belanja aset bahan baku yang menumpuk di gudang.</p>
          </div>
          <div className="space-y-1 border-b md:border-b-0 md:border-r border-border pb-3 md:pb-0 md:pr-4">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <HelpCircle size={12} className="text-primary shrink-0" /> Aset Bahan ≠ Kas
            </span>
            <p>Stok bahan baku bernilai jutaan rupiah (Nilai Aset Gudang) tidak bisa langsung ditarik pemilik atau dipakai membayar listrik sebelum barang tersebut terjual laku.</p>
          </div>
          <div className="space-y-1">
            <span className="font-bold text-ink flex items-center gap-1.5">
              <ShieldAlert size={12} className="text-warning shrink-0" /> Disclaimer Estimasi
            </span>
            <p>Hasil "Kas Aman Ditarik" ini adalah simulasi pembantu keputusan owner kedai kopi agar cash flow tidak macet, bukan pengganti Laba Bersih resmi akuntansi.</p>
          </div>
        </div>
      </Card>

      {/* 6. Analisis Konsumsi Staf/Pribadi */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-2">
            <Users className="text-primary shrink-0" size={18} />
            <div>
              <h2 className="text-sm font-bold text-ink uppercase tracking-wider">Analisis Konsumsi Staf & Owner</h2>
              <p className="text-[10px] text-ink-muted mt-0.5 font-medium">Lacak HPP produk yang dikonsumsi secara internal gratis oleh staf & owner.</p>
            </div>
          </div>
          
          {/* Budget Setting */}
          <div className="flex items-center gap-2 font-sans text-xs">
            <span className="font-semibold text-ink-muted">Limit Anggaran Bulanan:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-ink-secondary">Rp</span>
              <input
                type="number"
                value={staffMonthlyBudget}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setStaffMonthlyBudget(val);
                  localStorage.setItem('brewledger_staff_monthly_budget', String(val));
                }}
                className="w-24 px-1.5 py-0.5 text-xs font-mono font-bold bg-surface border border-border rounded focus:outline-none"
                min={0}
                step={25000}
              />
            </div>
          </div>
        </div>

        {/* Limit Budget Warning Alert */}
        {pc && Number(pc.estimatedCost) > staffMonthlyBudget && (
          <div className="bg-error/10 border border-error/25 p-4 rounded-xl flex items-start gap-2.5 font-sans text-xs text-error font-medium animate-pulse">
            <AlertTriangle className="shrink-0 mt-0.5 text-error" size={16} />
            <div>
              <strong>⚠️ Anggaran Konsumsi Internal Terlampaui!</strong>
              <p className="text-[10.5px] mt-0.5 opacity-90">
                Total estimasi biaya HPP konsumsi staf saat ini ({formatRupiah(Number(pc.estimatedCost))}) telah melebihi batas anggaran bulanan yang ditetapkan ({formatRupiah(staffMonthlyBudget)}). Pertimbangkan untuk mengontrol penarikan cup gratis.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
          {/* Group by Staff */}
          <div className="space-y-3">
            <h4 className="font-bold text-[10px] uppercase text-ink-muted tracking-wider">Konsumsi Berdasarkan Nama Staf</h4>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Staf</TableHead>
                    <TableHead align="right">Qty Gelas</TableHead>
                    <TableHead align="right">Total HPP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffSummaryList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-ink">{item.name}</TableCell>
                      <TableCell align="right" className="font-mono text-ink-secondary">{item.count} Gelas</TableCell>
                      <TableCell align="right" className="font-mono text-primary font-bold">{formatRupiah(item.cost)}</TableCell>
                    </TableRow>
                  ))}
                  {staffSummaryList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center italic text-ink-muted py-6">Tidak ada data konsumsi staf</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Group by Product */}
          <div className="space-y-3">
            <h4 className="font-bold text-[10px] uppercase text-ink-muted tracking-wider">Produk Terpopuler Dikonsumsi</h4>
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Menu</TableHead>
                    <TableHead align="right">Qty Gelas</TableHead>
                    <TableHead align="right">Total HPP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productSummaryList.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-ink">{item.name}</TableCell>
                      <TableCell align="right" className="font-mono text-ink-secondary">{item.count} Gelas</TableCell>
                      <TableCell align="right" className="font-mono text-primary font-bold">{formatRupiah(item.cost)}</TableCell>
                    </TableRow>
                  ))}
                  {productSummaryList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center italic text-ink-muted py-6">Tidak ada data produk</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </Card>

      {/* KESIMPULAN & ANALISIS KESEHATAN BISNIS */}
      <Card className="p-6 border border-border/80 bg-surface-soft space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <CheckCircle2 className="text-success" size={20} />
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider">KESIMPULAN & ANALISIS KESEHATAN BISNIS</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed">
          {/* Laba Rugi & Margin Analysis */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
              Profitabilitas & Margin Usaha
            </div>
            <p className="text-ink-secondary">
              {netProfit > 0 ? (
                <span>Model bisnis kedai kopi Anda saat ini <strong>sudah menghasilkan keuntungan</strong> dengan margin kotor sebesar <strong>{grossMargin.toFixed(1)}%</strong>. </span>
              ) : (
                <span>Model bisnis kedai kopi Anda saat ini <strong>belum menghasilkan keuntungan bersih</strong> (net profit negatif/nol). </span>
              )}
              Belanja bahan tidak langsung memotong laba karena tercatat sebagai aset stok. 
              {grossMargin > 50 ? (
                <span className="text-success font-semibold"> Status margin kotor Anda sangat sehat (di atas 50%).</span>
              ) : (
                <span className="text-warning font-semibold"> Status margin kotor berada di bawah 50%, pertimbangkan optimasi harga jual atau cari supplier lebih kompetitif.</span>
              )}
            </p>
          </div>

          {/* Cash Flow vs Inventory Analysis */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <span className={`w-1.5 h-1.5 rounded-full ${cashBalance >= 0 ? 'bg-success' : 'bg-warning'}`}></span>
              Analisis Arus Kas & Inventory
            </div>
            <p className="text-ink-secondary">
              {cashBalance > 0 ? (
                <span>Kondisi arus kas Anda <strong>masih positif</strong> (surplus kas sebesar {formatRupiah(cashBalance)}).</span>
              ) : (
                <span>Kondisi arus kas Anda sedang <strong>minus / negatif</strong> (defisit kas sebesar {formatRupiah(cashBalance)}).</span>
              )}
              {cashBalance < 0 && inventoryValuation > 0 && (
                <span> Namun, uang Anda <strong>tidak hilang</strong>, melainkan sebagian besar berubah menjadi <strong>aset stok (inventory) senilai {formatRupiah(inventoryValuation)}</strong> di gudang.</span>
              )}
              {lowStockCount > 0 ? (
                <span className="text-warning font-semibold block mt-1.5">
                  ⚠️ Ada {lowStockCount} bahan dengan stok kritis. Direkomendasikan untuk melakukan restock secukupnya, jangan overstock agar kas tidak semakin menipis.
                </span>
              ) : (
                <span className="text-success block mt-1.5">✅ Semua bahan berada dalam level stok aman.</span>
              )}
            </p>
          </div>

          {/* Recommendations Box */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-ink">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Rekomendasi Tindakan Strategis
            </div>
            <ul className="list-disc list-inside text-ink-secondary space-y-1">
              <li>
                <strong>Batasi overstock</strong> agar kas tidak mandek di gudang.
              </li>
              <li>
                <strong>Percepat perputaran inventory</strong> agar cepat kembali menjadi kas.
              </li>
              <li>
                <strong>Prioritaskan menu</strong> dengan margin tinggi.
              </li>
              <li>
                <strong>Restock hanya bahan</strong> yang mendekati batas minimum.
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-surface border border-border p-3 rounded-lg flex items-start gap-2.5 text-[11px] text-ink-secondary">
          <AlertTriangle className="text-warning shrink-0 mt-0.5" size={14} />
          <div>
            <strong>Catatan Keuangan Kedai Kopi:</strong> Model bisnis Anda saat ini sudah menghasilkan keuntungan dengan margin kotor sebesar {grossMargin.toFixed(1)}%. Belanja bahan tidak langsung memotong laba karena tercatat sebagai aset stok. Perhatikan arus kas agar tidak terlalu banyak uang tertahan di inventory.
          </div>
        </div>
      </Card>
    </div>
  );
}
