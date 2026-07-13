import { useState } from 'react';
import { AlertTriangle, DollarSign, Package, ShoppingBag, TrendingUp, Layers, Calendar, CheckCircle2 } from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { Card } from '../../components/ui/card';
import type { User } from '../auth/types';
import type { DashboardData } from '../reports/types';
import type { Sale } from '../sales/types';
import type { Expense } from '../expenses/types';
import type { Ingredient } from '../ingredients/types';
import { formatRupiah } from '../../utils/helpers';

interface DashboardPageProps {
  user: User | null;
  dashboardData: DashboardData & { todaySalesCount?: number; inventoryValuation?: number; lowStockItems?: Ingredient[] } | null;
  sales: Sale[];
  expenses: Expense[];
  ingredients: Ingredient[];
  setActiveTab: (tab: string) => void;
  reconciliations?: any[];
}

export default function DashboardPage({
  user,
  dashboardData,
  sales = [],
  expenses = [],
  ingredients = [],
  setActiveTab,
  reconciliations = [],
}: DashboardPageProps) {
  // Compute stock status counts
  const outOfStock = ingredients.filter(i => Number(i.currentStock) <= 0);
  const lowStock = ingredients.filter(i => {
    const cur = Number(i.currentStock);
    const min = Number(i.minimumStock);
    return cur > 0 && cur <= min;
  });
  const goodStock = ingredients.filter(i => Number(i.currentStock) > Number(i.minimumStock));

  const outCount = outOfStock.length;
  const lowCount = lowStock.length;
  const goodCount = goodStock.length;

  // Chart selection and aggregation logic
  const now = new Date();
  const startYear = 2026;
  const currentYear = now.getFullYear();
  const endYear = Math.max(currentYear, 2026) + 1;

  // Generate years list
  const availableYears: number[] = [];
  for (let y = startYear; y <= endYear; y++) {
    availableYears.push(y);
  }

  // Months list for dropdown selection
  const monthsList = [
    { value: 1, label: 'Januari' },
    { value: 2, label: 'Februari' },
    { value: 3, label: 'Maret' },
    { value: 4, label: 'April' },
    { value: 5, label: 'Mei' },
    { value: 6, label: 'Juni' },
    { value: 7, label: 'Juli' },
    { value: 8, label: 'Agustus' },
    { value: 9, label: 'September' },
    { value: 10, label: 'Oktober' },
    { value: 11, label: 'November' },
    { value: 12, label: 'Desember' },
  ];

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonthVal, setSelectedMonthVal] = useState(now.getMonth() + 1);

  const selectedMonthStr = `${selectedYear}-${String(selectedMonthVal).padStart(2, '0')}`;

  const getMonthLabel = (m: number) => {
    return monthsList.find(item => item.value === m)?.label || '';
  };

  // Generate continuous day list for selected month
  const daysInMonth = new Date(selectedYear, selectedMonthVal, 0).getDate();

  const chartData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const dayPrefix = `${selectedMonthStr}-${String(day).padStart(2, '0')}`;
    
    // Find all sales matching this day prefix
    const daySales = sales.filter(s => {
      if (!s.date) return false;
      return s.date.startsWith(dayPrefix);
    });

    const revenue = daySales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
    const profit = daySales.reduce((sum, s) => sum + Number(s.grossProfit), 0);

    return {
      dayLabel: `${day}`,
      revenue,
      profit,
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-lg border border-border text-xs shadow-md space-y-1">
          <p className="font-bold text-ink-secondary">Tanggal {payload[0].payload.dayLabel}</p>
          <p className="font-semibold text-emerald-500">Omset: <span className="font-mono">{formatRupiah(payload[0].value)}</span></p>
          {payload[1] && (
            <p className="font-semibold text-primary">Profit: <span className="font-mono">{formatRupiah(payload[1].value)}</span></p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">Selamat Datang, {user?.username}</h1>
          <p className="text-xs text-ink-secondary mt-1">Ringkasan operasional dan laporan keuangan bisnis kedai kopi hari ini.</p>
        </div>
        <div className="text-xs font-mono text-ink-muted bg-surface-soft border border-border px-3 py-1.5 rounded-md">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Cash Audit Banner */}
      {(() => {
        const lastRecon = reconciliations?.[0];
        if (!lastRecon) {
          return (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="font-bold text-ink-secondary">Audit Status Kas & Tutup Hari</p>
                  <p className="text-[10px] text-ink-muted mt-0.5">Belum pernah melakukan rekonsiliasi kas. Mulai audit berkala kas laci & bank Anda.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('reconciliations')}
                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold transition cursor-pointer active:scale-95 text-[10.5px] whitespace-nowrap"
              >
                Tutup Hari / Rekonsiliasi Kas
              </button>
            </div>
          );
        }

        const diff = Number(lastRecon.difference);
        const dateStr = new Date(lastRecon.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        const hasDiff = diff !== 0;

        return (
          <div className="bg-surface border border-border p-4 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 font-sans text-xs">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasDiff ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'}`}>
                <CheckCircle2 size={16} />
              </div>
              <div>
                <p className="font-bold text-ink-secondary">Audit Status Kas & Tutup Hari</p>
                <p className="text-[10px] text-ink-muted mt-0.5">Terakhir direkonsiliasi: <strong>{dateStr}</strong> (Akun: {lastRecon.account})</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end">
              <div>
                <p className="text-[9px] uppercase text-ink-muted tracking-wider font-bold">Selisih Terakhir</p>
                <p className={`font-mono font-bold text-xs mt-0.5 ${diff > 0 ? 'text-success' : diff < 0 ? 'text-error' : 'text-ink-secondary'}`}>
                  {diff > 0 ? `+${formatRupiah(diff)}` : diff < 0 ? `-${formatRupiah(Math.abs(diff))}` : 'Sesuai (Rp0)'}
                </p>
              </div>

              <div>
                <p className="text-[9px] uppercase text-ink-muted tracking-wider font-bold">Status Kas</p>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border mt-0.5 uppercase tracking-wider ${
                  !hasDiff 
                    ? 'bg-success/15 border-success/30 text-success' 
                    : 'bg-warning/15 border-warning/30 text-warning animate-pulse'
                }`}>
                  {!hasDiff ? 'Sesuai' : 'Ada Selisih'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('reconciliations')}
                className="px-3 py-1.5 rounded-lg border border-border text-ink-secondary hover:bg-surface-soft hover:text-ink font-semibold transition cursor-pointer active:scale-95 text-[10.5px] whitespace-nowrap"
              >
                Buka Rekonsiliasi
              </button>
            </div>
          </div>
        );
      })()}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Omset Hari Ini */}
        <Card dense className="flex flex-col justify-between min-h-28">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <span>Omset Hari Ini</span>
            <ShoppingBag size={14} className="text-ink-secondary" />
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold font-mono tracking-tight">{formatRupiah(dashboardData?.todayRevenue || 0)}</div>
            <div className="text-[10px] text-ink-muted mt-1 font-mono">{dashboardData?.todaySalesCount || 0} transaksi</div>
          </div>
        </Card>

        {/* Profit Hari Ini */}
        <Card dense className="flex flex-col justify-between min-h-28">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <span>Profit Hari Ini</span>
            <DollarSign size={14} className="text-success" />
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold font-mono tracking-tight text-success">{formatRupiah(dashboardData?.todayProfit || 0)}</div>
            <div className="text-[10px] text-ink-muted mt-1">Estimasi HPP produk</div>
          </div>
        </Card>

        {/* Omset Bulan Ini */}
        <Card dense className="flex flex-col justify-between min-h-28">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <span>Omset Bulan Ini</span>
            <TrendingUp size={14} className="text-focus" />
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold font-mono tracking-tight text-ink">{formatRupiah(dashboardData?.monthlyRevenue || 0)}</div>
            <div className="text-[10px] text-ink-muted mt-1">Akumulasi bulan berjalan</div>
          </div>
        </Card>

        {/* Nilai Aset Inventory */}
        <Card dense className="flex flex-col justify-between min-h-28">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-ink-muted">
            <span>Nilai Aset Inventory</span>
            <Package size={14} className="text-warning" />
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold font-mono tracking-tight text-warning">{formatRupiah(dashboardData?.inventoryValuation || 0)}</div>
            <div className="text-[10px] text-ink-muted mt-1 font-mono">Bahan baku & packaging</div>
          </div>
        </Card>
      </div>

      {/* Sales Turnover Chart Card */}
      <Card className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500" />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
                Tren Omset & Profit Penjualan
              </h3>
              <p className="text-[10px] text-ink-muted mt-0.5">Grafik harian untuk bulan {getMonthLabel(selectedMonthVal)} {selectedYear}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider whitespace-nowrap">Bulan:</span>
              <select
                value={selectedMonthVal}
                onChange={(e) => setSelectedMonthVal(Number(e.target.value))}
                className="bg-surface border border-border text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus font-medium cursor-pointer"
              >
                {monthsList.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted font-bold uppercase tracking-wider whitespace-nowrap">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-surface border border-border text-ink text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-focus focus:ring-1 focus:ring-focus font-medium cursor-pointer"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis 
                dataKey="dayLabel" 
                stroke="var(--ink-muted)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--ink-muted)" 
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `Rp ${value >= 1000 ? (value / 1000) + 'k' : value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                name="Omset"
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
              <Area 
                type="monotone" 
                dataKey="profit" 
                name="Profit"
                stroke="var(--primary)" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorProfit)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Stock Status Tracker Section */}
      <Card className="space-y-6">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink-secondary">
              Status Inventory & Bahan Baku
            </h3>
          </div>
          <button 
            onClick={() => setActiveTab('ingredients')}
            className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
          >
            Kelola Bahan Baku
          </button>
        </div>

        {/* Detailed Item List */}
        {ingredients.length > 0 ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ingredients.map((ing) => {
                const cur = Number(ing.currentStock);
                const min = Number(ing.minimumStock);
                const isOut = cur <= 0;
                const isLow = cur > 0 && cur <= min;
                
                let statusLabel = 'Tersedia';
                let statusColor = 'text-success bg-success/10 border-success/20';
                if (isOut) {
                  statusLabel = 'Habis';
                  statusColor = 'text-error bg-error/10 border-error/20';
                } else if (isLow) {
                  statusLabel = 'Menipis';
                  statusColor = 'text-warning bg-warning/10 border-warning/20';
                }

                return (
                  <div key={ing.id} className="p-3 border border-border rounded-lg bg-surface-soft flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-semibold text-xs text-ink truncate pr-2">{ing.name}</span>
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-medium ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] text-ink-muted font-mono">
                        <span>Stok: <strong>{cur}</strong> {ing.unit}</span>
                        <span>Min: {min} {ing.unit}</span>
                      </div>
                      {/* Visual Progress Line Indicator */}
                      <div className="w-full bg-surface-muted h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOut ? 'bg-error' : isLow ? 'bg-warning' : 'bg-success'
                          }`}
                          style={{ 
                            width: `${
                              isOut ? 0 : 
                              isLow ? Math.max(8, Math.min((cur / (min || 1)) * 100, 100)) : 
                              Math.max(8, Math.min((cur / ((min || 1) * 2)) * 100, 100))
                            }%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dot Legends at the bottom of the grid */}
            <div className="flex flex-wrap gap-4 text-[10px] font-semibold uppercase tracking-wider text-ink-muted border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                <span>Tersedia: {goodCount} bahan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning inline-block" />
                <span>Menipis: {lowCount} bahan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-error inline-block" />
                <span>Habis: {outCount} bahan</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink-muted text-center py-4">Belum ada bahan baku terdaftar.</p>
        )}
      </Card>

      {/* Low stock alerts banner */}
      {dashboardData?.lowStockItems && dashboardData.lowStockItems.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-5">
          <div className="flex items-center gap-2 text-warning font-bold text-xs mb-3">
            <AlertTriangle size={15} />
            <span>Peringatan Stok Rendah ({dashboardData.lowStockItems.length} bahan baku di bawah batas minimum)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {dashboardData.lowStockItems.map((item: Ingredient) => (
              <div key={item.id} className="p-3 rounded-lg border border-border bg-surface flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-ink">{item.name}</p>
                  <p className="text-[10px] text-ink-muted font-mono mt-0.5">Min. stok: {item.minimumStock} {item.unit}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-warning font-mono">{item.currentStock} {item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              Transaksi Penjualan Terbaru
            </h3>
            <button 
              onClick={() => setActiveTab('sales')} 
              className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-2">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-surface-soft hover:bg-surface-muted transition">
                <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                  <p className="font-semibold text-xs text-ink truncate">
                    {sale.items.map((i: any) => `${i.quantity}x ${i.menu?.name || 'Item Kustom'}`).join(', ')}
                  </p>
                  <p className="text-[10px] text-ink-muted truncate">
                    {new Date(sale.date).toLocaleDateString('id-ID')} • {sale.notes ? sale.notes.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean).join(' • ') : 'Tanpa catatan'}
                  </p>
                </div>
                <span className="font-bold text-xs text-ink font-mono shrink-0">{formatRupiah(sale.totalAmount)}</span>
              </div>
            ))}
            {sales.length === 0 && (
              <div className="text-center py-8 text-ink-muted text-xs">Belum ada transaksi penjualan.</div>
            )}
          </div>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-secondary">
              Log Pengeluaran Terbaru
            </h3>
            <button 
              onClick={() => setActiveTab('expenses')} 
              className="text-[10px] text-link hover:underline font-semibold cursor-pointer"
            >
              Lihat Semua
            </button>
          </div>
          <div className="space-y-2">
            {expenses.slice(0, 5).map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-surface-soft hover:bg-surface-muted transition">
                <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                  <p className="font-semibold text-xs text-ink truncate">{exp.supplier}</p>
                  <p className="text-[10px] text-ink-muted truncate">
                    {new Date(exp.date).toLocaleDateString('id-ID')} • {exp.notes || 'Pembelian bahan'}
                  </p>
                </div>
                <span className="font-bold text-xs text-ink font-mono shrink-0">{formatRupiah(exp.totalCost)}</span>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-8 text-ink-muted text-xs">Belum ada log pengeluaran.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
