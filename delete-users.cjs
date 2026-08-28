// Script de uso único: elimina de Firebase Authentication las cuentas cuyos
// emails se pasan como argumentos. No forma parte de la app (no se importa
// desde src/), solo se corre manualmente con Node.
//
// Uso:
//   node delete-users.cjs correo1@dominio.com correo2@dominio.com

const fs = require('fs');
const path = require('path');

const SERVICE_ACCOUNT_PATTERN = /firebase-adminsdk.*\.json$|^serviceAccountKey\.json$/i;

function findServiceAccountFile() {
  const candidates = fs.readdirSync(__dirname).filter(f => SERVICE_ACCOUNT_PATTERN.test(f));
  if (candidates.length !== 1) {
    console.error('Esperaba encontrar exactamente un archivo de clave de administrador en la raíz.');
    process.exit(1);
  }
  return path.join(__dirname, candidates[0]);
}

async function main() {
  const emails = process.argv.slice(2);
  if (emails.length === 0) {
    console.error('Uso: node delete-users.cjs correo1@dominio.com correo2@dominio.com ...');
    process.exit(1);
  }

  const serviceAccountPath = findServiceAccountFile();
  const { initializeApp, cert } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');

  const app = initializeApp({ credential: cert(require(serviceAccountPath)) });
  const auth = getAuth(app);

  for (const email of emails) {
    try {
      const user = await auth.getUserByEmail(email);
      await auth.deleteUser(user.uid);
      console.log('✓ Eliminada:', email);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        console.log('~ No existía (nada que borrar):', email);
      } else {
        console.error('✗ Error con', email, ':', err.message);
      }
    }
  }
}

main().catch(err => {
  console.error('Error general:', err);
  process.exit(1);
});
