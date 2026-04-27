import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  if (!password) throw new Error('Contraseña requerida');
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password, hash) {
  if (!password || !hash) return false;
  return await bcrypt.compare(password, hash);
}

export default { hashPassword, comparePassword };