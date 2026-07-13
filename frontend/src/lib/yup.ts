import * as yup from 'yup';

yup.setLocale({
  mixed: {
    required: '${label} wajib diisi',
    default: '${label} tidak valid',
    notType: '${label} harus berupa angka',
  },
  string: {
    min: '${label} minimal ${min} karakter',
    max: '${label} maksimal ${max} karakter',
    email: '${label} harus berupa email yang valid',
  },
  number: {
    min: '${label} minimal bernilai ${min}',
    max: '${label} maksimal bernilai ${max}',
    positive: '${label} harus bernilai positif',
  },
});

export default yup;
export * from 'yup';
