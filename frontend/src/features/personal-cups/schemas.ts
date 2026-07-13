import yup from '../../lib/yup';

export const personalCupSchema = yup.object().shape({
  menuId: yup.string().required('Pilih menu terlebih dahulu').label('Menu Minuman'),
  date: yup.string().required().label('Tanggal'),
  useCup: yup.boolean().required().label('Gunakan Cup'),
  notes: yup.string().label('Catatan'),
});
