// Genera una contraseña aleatoria de 24 caracteres base64url y su hash scrypt.
// Formato del hash: scrypt:N:r:p:saltHex:hashHex
import { randomBytes, scryptSync } from 'node:crypto';

const N = 32768;
const r = 8;
const p = 1;
const password = randomBytes(18).toString('base64url');
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });

console.log('PASSWORD:', password);
console.log('APP_PASSWORD_HASH:', ['scrypt', N, r, p, salt.toString('hex'), hash.toString('hex')].join(':'));
console.log('\nGuarda la contraseña en tu gestor de contraseñas. El hash va en la variable APP_PASSWORD_HASH.');
