import yup from '../../lib/yup';

export const ingredientSchema = yup.object().shape({
  name: yup.string().trim().required().label('Nama Bahan Baku'),
  category: yup.string().oneOf(['RAW_MATERIAL', 'PACKAGING', 'OTHER']).required().label('Kategori'),
  currentStock: yup.number().min(0).required().label('Stok Saat Ini'),
  unit: yup.string().required().label('Satuan'),
  minimumStock: yup.number().min(0).required().label('Batas Minimum'),
  safetyStock: yup.number().min(0).label('Safety Stock'),
  latestUnitCost: yup.number().min(0).required().label('Harga Satuan Terakhir'),
});

export const ingredientEditSchema = yup.object().shape({
  name: yup.string().trim().required().label('Nama Bahan Baku'),
  category: yup.string().oneOf(['RAW_MATERIAL', 'PACKAGING', 'OTHER']).required().label('Kategori'),
  unit: yup.string().required().label('Satuan'),
  minimumStock: yup.number().min(0).required().label('Batas Minimum'),
  safetyStock: yup.number().min(0).label('Safety Stock'),
});

export const adjustStockSchema = yup.object().shape({
  quantityChange: yup.number().required().notOneOf([0], 'Perubahan stok tidak boleh 0').label('Jumlah Penyesuaian'),
  notes: yup.string().trim().required('Catatan penyesuaian wajib diisi').label('Catatan'),
});
