import yup from '../../lib/yup';

export const orderItemSchema = yup.object().shape({
  menuId: yup.string().required('Pilih menu terlebih dahulu').label('Menu'),
  quantity: yup.number().integer().positive().required().label('Jumlah'),
  sugarLevel: yup.string().oneOf(['LESS', 'NORMAL', 'EXTRA']).required().label('Kadar Gula'),
  extras: yup.array().of(
    yup.object().shape({
      menuId: yup.string().required().label('Tambahan'),
      quantity: yup.number().integer().positive().required().label('Jumlah Tambahan'),
    })
  ).default([]),
});

export const orderSchema = yup.object().shape({
  orderDate: yup.string().required().label('Tanggal Order'),
  customerName: yup.string().trim().required().label('Nama Pelanggan'),
  notes: yup.string().label('Catatan'),
  items: yup.array().of(orderItemSchema).min(1, 'Minimal harus ada 1 item pesanan').required().label('Daftar Pesanan'),
});
