import yup from '../../lib/yup';

export const expenseItemSchema = yup.object().shape({
  ingredientId: yup.string().required('Bahan baku harus dipilih').label('Bahan Baku'),
  quantity: yup.number().positive().required().label('Kantiitas'),
  totalPrice: yup.number().positive().required().label('Total Harga'),
});

export const expenseSchema = yup.object().shape({
  supplier: yup.string().trim().required().label('Nama Supplier'),
  date: yup.string().required().label('Tanggal Pengeluaran'),
  notes: yup.string().label('Catatan'),
  items: yup.array().of(expenseItemSchema).min(1, 'Minimal harus ada 1 item pengeluaran').required().label('Daftar Item'),
});
