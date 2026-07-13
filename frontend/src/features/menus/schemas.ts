import yup from '../../lib/yup';

export const menuSchema = yup.object().shape({
  name: yup.string().trim().required().label('Nama Menu'),
  category: yup.string().required().label('Kategori'),
  basePrice: yup.number().positive().required().label('Harga Dasar'),
  recipe: yup.array().of(
    yup.object().shape({
      ingredientId: yup.string().required().label('Bahan Baku'),
      quantity: yup.number().positive().required().label('Jumlah Resep'),
    })
  ).default([]),
});
