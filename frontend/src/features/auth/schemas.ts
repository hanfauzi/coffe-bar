import yup from '../../lib/yup';

export const loginSchema = yup.object().shape({
  username: yup.string().min(3).required().label('Username'),
  password: yup.string().min(6).required().label('Password'),
});

export const registerSchema = yup.object().shape({
  username: yup.string().min(3).required().label('Username'),
  password: yup.string().min(6).required().label('Password'),
});
