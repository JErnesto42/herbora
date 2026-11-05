const { Router } = require('express');
const pool = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = Router();
const columns = `id, nome_popular AS nomePopular, nome_cientifico AS nomeCientifico,
  categoria, resumo, uso_tradicional AS usoTradicional, preparo,
  compostos, cuidados, combinacoes`;
const fields = ['nomePopular', 'nomeCientifico', 'categoria', 'resumo', 'usoTradicional', 'preparo', 'compostos', 'cuidados', 'combinacoes'];
const dbFields = ['nome_popular', 'nome_cientifico', 'categoria', 'resumo', 'uso_tradicional', 'preparo', 'compostos', 'cuidados', 'combinacoes'];

function validatePlant(body) {
  if (!body || fields.some((field) => typeof body[field] !== 'string' || !body[field].trim())) {
    return 'Preencha todos os campos da planta.';
  }
  if (body.nomePopular.trim().length > 120 || body.nomeCientifico.trim().length > 180) {
    return 'O nome da planta excede o limite permitido.';
  }
  return null;
}

router.get('/', async (req, res, next) => {
  try {
    const [plants] = await pool.query(`SELECT ${columns} FROM plants WHERE active = 1 ORDER BY nome_popular`);
    return res.json({ plants });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Identificador inválido.' });
  try {
    const [rows] = await pool.execute(`SELECT ${columns} FROM plants WHERE id = ? AND active = 1 LIMIT 1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Planta não encontrada.' });
    return res.json({ plant: rows[0] });
  } catch (error) {
    return next(error);
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  const validationMessage = validatePlant(req.body);
  if (validationMessage) return res.status(400).json({ message: validationMessage });
  try {
    const values = fields.map((field) => req.body[field].trim());
    const [existing] = await pool.execute(
      'SELECT id FROM plants WHERE nome_cientifico = ? LIMIT 1',
      [req.body.nomeCientifico.trim()],
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Já existe uma planta cadastrada com esse nome científico.' });
    }
    const placeholders = dbFields.map(() => '?').join(', ');
    const [result] = await pool.execute(
      `INSERT INTO plants (${dbFields.join(', ')}) VALUES (${placeholders})`,
      values,
    );
    return res.status(201).json({ id: result.insertId, message: 'Planta cadastrada.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já existe uma planta cadastrada com esse nome científico.' });
    }
    return next(error);
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Identificador inválido.' });
  const validationMessage = validatePlant(req.body);
  if (validationMessage) return res.status(400).json({ message: validationMessage });
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM plants WHERE nome_cientifico = ? AND id <> ? LIMIT 1',
      [req.body.nomeCientifico.trim(), req.params.id],
    );
    if (existing.length) {
      return res.status(409).json({ message: 'Já existe outra planta cadastrada com esse nome científico.' });
    }
    const assignments = dbFields.map((field) => `${field} = ?`).join(', ');
    const values = [...fields.map((field) => req.body[field].trim()), req.params.id];
    const [result] = await pool.execute(
      `UPDATE plants SET ${assignments} WHERE id = ? AND active = 1`,
      values,
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Planta não encontrada.' });
    return res.json({ message: 'Planta atualizada.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já existe outra planta cadastrada com esse nome científico.' });
    }
    return next(error);
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Identificador inválido.' });
  try {
    const [result] = await pool.execute(
      'UPDATE plants SET active = 0 WHERE id = ? AND active = 1',
      [req.params.id],
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Planta não encontrada.' });
    return res.json({ message: 'Planta removida do catálogo.' });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
