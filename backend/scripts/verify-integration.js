const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const missingSettings = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter((key) => !process.env[key]);
if (missingSettings.length) {
  throw new Error(`Configure ${missingSettings.join(', ')} em backend/.env antes do teste integrado.`);
}

const apiUrl = (process.env.HERBORA_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 2,
  queueLimit: 0,
  charset: 'utf8mb4',
});

async function request(pathname, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${apiUrl}${pathname}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json();
  return { status: response.status, payload };
}

function logStep(description) {
  console.log('PASS ' + description);
}

async function runIntegration() {
  const suffix = crypto.randomUUID().replace(/-/g, '');
  const email = `herbora.integration.${suffix}@example.test`;
  const password = `Test-${crypto.randomBytes(24).toString('hex')}`;
  const scientificName = `HerboraIntegration${suffix}`;
  let userId;
  let testError;

  try {
    const health = await request('/health');
    assert.equal(health.status, 200);
    assert.equal(health.payload.status, 'ok');
    assert.equal(health.payload.database, 'connected');
    logStep('API and MySQL health check');

    const missingConsent = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Herbora Integration Test', email, password, privacyConsent: false },
    });
    assert.equal(missingConsent.status, 400);
    logStep('registration requires privacy consent');

    const registration = await request('/auth/register', {
      method: 'POST',
      body: { name: 'Herbora Integration Test', email, password, privacyConsent: true },
    });
    assert.equal(registration.status, 201);
    assert.equal(registration.payload.user.role, 'member');
    assert.ok(registration.payload.token);
    userId = registration.payload.user.id;

    const [users] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    assert.equal(users.length, 1);
    assert.notEqual(users[0].password_hash, password);
    assert.match(users[0].password_hash, /^\$2[aby]\$/);
    logStep('registration stores a bcrypt hash and assigns member role');

    const invalidLogin = await request('/auth/login', {
      method: 'POST',
      body: { email, password: `${password}-wrong` },
    });
    assert.equal(invalidLogin.status, 401);

    const memberLogin = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(memberLogin.status, 200);
    assert.equal(memberLogin.payload.user.role, 'member');
    assert.ok(memberLogin.payload.token);
    logStep('login validates credentials and issues a member JWT');

    const currentUser = await request('/auth/me', { token: memberLogin.payload.token });
    assert.equal(currentUser.status, 200);
    assert.equal(currentUser.payload.user.email, email);
    logStep('JWT authenticates the current-user route');

    const updatedProfile = await request('/auth/me', {
      method: 'PUT',
      body: { name: 'Herbora Integration Updated', email },
      token: memberLogin.payload.token,
    });
    assert.equal(updatedProfile.status, 200);
    assert.equal(updatedProfile.payload.user.name, 'Herbora Integration Updated');
    logStep('member can view and update their profile');

    const testPlant = {
      nomePopular: 'Planta de teste Herbora',
      nomeCientifico: scientificName,
      categoria: 'TESTE',
      resumo: 'Registro temporário para validar a integração.',
      usoTradicional: 'Conteúdo temporário de teste.',
      preparo: 'Conteúdo temporário de teste.',
      compostos: 'Conteúdo temporário de teste.',
      cuidados: 'Conteúdo temporário de teste.',
      combinacoes: 'Conteúdo temporário de teste.',
    };

    const deniedCreate = await request('/plants', {
      method: 'POST',
      body: testPlant,
      token: memberLogin.payload.token,
    });
    assert.equal(deniedCreate.status, 403);
    logStep('member JWT cannot write to the plant catalog');

    const [roleUpdate] = await pool.execute(
      "UPDATE users SET role = 'admin' WHERE id = ?",
      [userId],
    );
    assert.equal(roleUpdate.affectedRows, 1);

    const adminLogin = await request('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    assert.equal(adminLogin.status, 200);
    assert.equal(adminLogin.payload.user.role, 'admin');
    assert.ok(adminLogin.payload.token);
    logStep('admin role is reflected in the issued JWT');

    const created = await request('/plants', {
      method: 'POST',
      body: testPlant,
      token: adminLogin.payload.token,
    });
    assert.equal(created.status, 201);
    assert.ok(created.payload.id);
    const plantId = created.payload.id;
    logStep('administrator creates a plant');

    const guestPlant = await request(`/plants/${plantId}`);
    assert.equal(guestPlant.status, 200);
    assert.equal(guestPlant.payload.plant.usoTradicional, testPlant.usoTradicional);
    assert.equal(guestPlant.payload.plant.cuidados, testPlant.cuidados);
    assert.equal(Object.hasOwn(guestPlant.payload.plant, 'preparo'), false);

    const memberPlant = await request(`/plants/${plantId}`, { token: memberLogin.payload.token });
    assert.equal(memberPlant.status, 200);
    assert.equal(memberPlant.payload.plant.preparo, testPlant.preparo);
    const guestCatalog = await request('/plants');
    assert.equal(Object.hasOwn(guestCatalog.payload.plants[0], 'preparo'), false);
    const adminCatalog = await request('/plants', { token: adminLogin.payload.token });
    assert.equal(Object.hasOwn(adminCatalog.payload.plants.find((plant) => plant.id === plantId), 'preparo'), true);
    logStep('guest receives public fields while authenticated users and admins receive appropriate details');

    const accountState = await request(`/account/plants/${plantId}`, { token: memberLogin.payload.token });
    assert.equal(accountState.status, 200);
    assert.equal(accountState.payload.favorite, false);

    const favoriteAdded = await request(`/account/favorites/${plantId}`, {
      method: 'POST',
      token: memberLogin.payload.token,
    });
    assert.equal(favoriteAdded.status, 201);
    const favorites = await request('/account/favorites', { token: memberLogin.payload.token });
    assert.ok(favorites.payload.plants.some((plant) => plant.id === plantId));

    const historyAdded = await request(`/account/history/${plantId}`, {
      method: 'POST',
      token: memberLogin.payload.token,
    });
    assert.equal(historyAdded.status, 200);
    const history = await request('/account/history', { token: memberLogin.payload.token });
    assert.ok(history.payload.plants.some((plant) => plant.id === plantId));

    const noteSaved = await request(`/account/notes/${plantId}`, {
      method: 'PUT',
      body: { note: 'Anotação privada de teste.' },
      token: memberLogin.payload.token,
    });
    assert.equal(noteSaved.status, 200);
    const notes = await request('/account/notes', { token: memberLogin.payload.token });
    assert.ok(notes.payload.notes.some((note) => note.id === plantId && note.note === 'Anotação privada de teste.'));
    logStep('member favorites, history, and private notes persist');

    const duplicate = await request('/plants', {
      method: 'POST',
      body: testPlant,
      token: adminLogin.payload.token,
    });
    assert.equal(duplicate.status, 409);

    const detail = await request(`/plants/${plantId}`);
    assert.equal(detail.status, 200);
    assert.equal(detail.payload.plant.nomeCientifico, scientificName);
    logStep('public catalog reads the plant and rejects duplicates');

    const updated = await request(`/plants/${plantId}`, {
      method: 'PUT',
      body: { ...testPlant, resumo: 'Resumo atualizado no teste integrado.' },
      token: adminLogin.payload.token,
    });
    assert.equal(updated.status, 200);
    const updatedDetail = await request(`/plants/${plantId}`);
    assert.equal(updatedDetail.payload.plant.resumo, 'Resumo atualizado no teste integrado.');
    logStep('administrator updates a plant');

    const removed = await request(`/plants/${plantId}`, {
      method: 'DELETE',
      token: adminLogin.payload.token,
    });
    assert.equal(removed.status, 200);
    const hiddenDetail = await request(`/plants/${plantId}`);
    assert.equal(hiddenDetail.status, 404);
    logStep('administrator deactivates the plant and removes it from public detail');

    const [remainingPersonalRows] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM plant_favorites WHERE plant_id = ?) +
         (SELECT COUNT(*) FROM plant_history WHERE plant_id = ?) +
         (SELECT COUNT(*) FROM plant_notes WHERE plant_id = ?) AS total`,
      [plantId, plantId, plantId],
    );
    assert.equal(remainingPersonalRows[0].total, 3);
  } catch (error) {
    testError = error;
  } finally {
    const cleanupResults = await Promise.allSettled([
      pool.execute('DELETE FROM plants WHERE nome_cientifico = ?', [scientificName]),
      ...(userId ? [pool.execute('DELETE FROM users WHERE id = ?', [userId])] : []),
    ]);
    await pool.end();
    const cleanupFailure = cleanupResults.find((result) => result.status === 'rejected');
    if (cleanupFailure) {
      console.error(`Cleanup failed for temporary integration records: ${cleanupFailure.reason.message}`);
      process.exitCode = 1;
    }
  }

  if (testError) throw testError;
  if (!process.exitCode) console.log('Integration test completed; temporary records were removed.');
}

runIntegration().catch((error) => {
  console.error(`Integration test failed: ${error.message}`);
  process.exitCode = 1;
});
