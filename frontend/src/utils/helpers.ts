export function formatRupiah(val: number | string): string {
  const num = typeof val === 'string' ? parseFloat(val) : val;
  return 'Rp ' + (num || 0).toLocaleString('id-ID', { maximumFractionDigits: 0 });
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (_) {
    return dateStr;
  }
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (_) {
    return dateStr;
  }
}

export function translateCategory(category: string): string {
  switch (category) {
    case 'RAW_MATERIAL':
      return 'Bahan Baku';
    case 'PACKAGING':
      return 'Kemasan';
    case 'OTHER':
      return 'Lainnya';
    default:
      return category;
  }
}

export function translateTxType(type: string): string {
  switch (type) {
    case 'PURCHASE':
      return 'Pembelian';
    case 'SALE_USAGE':
      return 'Pemakaian Penjualan';
    case 'PERSONAL_USAGE':
      return 'Konsumsi Pribadi';
    case 'MANUAL_ADJUSTMENT':
      return 'Penyesuaian Manual';
    case 'WASTE':
      return 'Bahan Rusak / Kadaluarsa';
    case 'CORRECTION':
      return 'Koreksi Audit';
    default:
      return type;
  }
}

export function getValidationErrorMap(err: any): Record<string, string> {
  const formattedErrors: Record<string, string> = {};
  if (err && err.inner && Array.isArray(err.inner)) {
    err.inner.forEach((error: any) => {
      if (error.path) {
        formattedErrors[error.path] = error.message;
      }
    });
  }
  return formattedErrors;
}

