const { Router } = require('express');
const pool = require('../db');
const { requireAuth, requireMember } = require('../middleware/auth');

const router = Router();
const plantColumns = `p.id, p.nome_popular AS nomePopular, p.nome_cientifico AS nomeCientifico,
  p.categoria, p.resumo, p.uso_tradicional AS usoTradicional, p.cuidados`;

router.use(requireAuth, requireMember);

async function findActivePlant(plantId) {
  const [plants] = await pool.execute(
    'SELECT id FROM plants WHERE id = ? AND active = 1 LIMIT 1',
    [plantId],
  );
  return plants[0];
}

function validatePlantId(req, res, next) {
  if (!/^\d+$/.test(req.params.plantId)) {
    return res.status(400).json({ message: 'Identificador inválido.' });
  }
  return next();
}

router.get('/plants/:plantId', validatePlantId, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         EXISTS(SELECT 1 FROM plant_favorites WHERE user_id = ? AND plant_id = ?) AS favorite,
         (SELECT note FROM plant_notes WHERE user_id = ? AND plant_id = ? LIMIT 1) AS note
       FROM plants WHERE id = ? AND active = 1 LIMIT 1`,
      [req.user.sub, req.params.plantId, req.user.sub, req.params.plantId, req.params.plantId],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Planta não encontrada.' });
    return res.json({ favorite: Number(rows[0].favorite) === 1, note: rows[0].note || '' });
  } catch (error) {
    return next(error);
  }
});

router.get('/favorites', async (req, res, next) => {
  try {
    const [plants] = await pool.execute(
      `SELECT ${plantColumns}, f.created_at AS savedAt
       FROM plant_favorites f
       INNER JOIN plants p ON p.id = f.plant_id
       WHERE f.user_id = ? AND p.active = 1
       ORDER BY f.created_at DESC`,
      [req.user.sub],
    );
    return res.json({ plants });
  } catch (error) {
    return next(error);
  }
});

router.post('/favorites/:plantId', validatePlantId, async (req, res, next) => {
  try {
    if (!(await findActivePlant(req.params.plantId))) {
      return res.status(404).json({ message: 'Planta não encontrada.' });
    }
    await pool.execute(
      'INSERT IGNORE INTO plant_favorites (user_id, plant_id) VALUES (?, ?)',
      [req.user.sub, req.params.plantId],
    );
    return res.status(201).json({ message: 'Planta salva nos favoritos.' });
  } catch (error) {
    return next(error);
  }
});

router.delete('/favorites/:plantId', validatePlantId, async (req, res, next) => {
  try {
    await pool.execute(
      'DELETE FROM plant_favorites WHERE user_id = ? AND plant_id = ?',
      [req.user.sub, req.params.plantId],
    );
    return res.json({ message: 'Planta removida dos favoritos.' });
  } catch (error) {
    return next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const [plants] = await pool.execute(
      `SELECT ${plantColumns}, h.last_viewed_at AS lastViewedAt
       FROM plant_history h
       INNER JOIN plants p ON p.id = h.plant_id
       WHERE h.user_id = ? AND p.active = 1
       ORDER BY h.last_viewed_at DESC
       LIMIT 50`,
      [req.user.sub],
    );
    return res.json({ plants });
  } catch (error) {
    return next(error);
  }
});

router.post('/history/:plantId', validatePlantId, async (req, res, next) => {
  try {
    if (!(await findActivePlant(req.params.plantId))) {
      return res.status(404).json({ message: 'Planta não encontrada.' });
    }
    await pool.execute(
      `INSERT INTO plant_history (user_id, plant_id, last_viewed_at)
       SELECT ?, id, CURRENT_TIMESTAMP FROM plants WHERE id = ? AND active = 1
       ON DUPLICATE KEY UPDATE last_viewed_at = CURRENT_TIMESTAMP`,
      [req.user.sub, req.params.plantId],
    );
    return res.json({ message: 'Histórico atualizado.' });
  } catch (error) {
    return next(error);
  }
});

router.get('/notes', async (req, res, next) => {
  try {
    const [notes] = await pool.execute(
      `SELECT ${plantColumns}, n.note, n.updated_at AS updatedAt
       FROM plant_notes n
       INNER JOIN plants p ON p.id = n.plant_id
       WHERE n.user_id = ? AND p.active = 1
       ORDER BY n.updated_at DESC`,
      [req.user.sub],
    );
    return res.json({ notes });
  } catch (error) {
    return next(error);
  }
});

router.get('/notes/:plantId', validatePlantId, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT note FROM plant_notes WHERE user_id = ? AND plant_id = ? LIMIT 1',
      [req.user.sub, req.params.plantId],
    );
    return res.json({ note: rows[0]?.note || '' });
  } catch (error) {
    return next(error);
  }
});

router.put('/notes/:plantId', validatePlantId, async (req, res, next) => {
  const note = req.body?.note;
  if (typeof note !== 'string' || !note.trim() || note.trim().length > 4000) {
    return res.status(400).json({ message: 'A anotação deve ter entre 1 e 4000 caracteres.' });
  }

  try {
    if (!(await findActivePlant(req.params.plantId))) {
      return res.status(404).json({ message: 'Planta não encontrada.' });
    }
    await pool.execute(
      `INSERT INTO plant_notes (user_id, plant_id, note) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE note = VALUES(note)`,
      [req.user.sub, req.params.plantId, note.trim()],
    );
    return res.json({ message: 'Anotação salva.' });
  } catch (error) {
    return next(error);
  }
});

router.delete('/notes/:plantId', validatePlantId, async (req, res, next) => {
  try {
    await pool.execute(
      'DELETE FROM plant_notes WHERE user_id = ? AND plant_id = ?',
      [req.user.sub, req.params.plantId],
    );
    return res.json({ message: 'Anotação removida.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
