const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = Router();

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

router.post('/register', async (req, res, next) => {
  const { name, email, password, privacyConsent } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
    return res.status(400).json({ message: 'Informe um nome com 2 a 120 caracteres.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 190) {
    return res.status(400).json({ message: 'Informe um e-mail válido.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 72) {
    return res.status(400).json({ message: 'A senha deve ter entre 8 e 72 caracteres.' });
  }
  if (Buffer.byteLength(password, 'utf8') > 72) {
    return res.status(400).json({ message: 'A senha deve ter no máximo 72 bytes em UTF-8.' });
  }
  if (privacyConsent !== true) {
    return res.status(400).json({ message: 'É necessário consentir com o uso dos dados para criar a conta.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash, role, privacy_consent_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [name.trim(), normalizedEmail, passwordHash, 'member'],
    );
    const user = { id: result.insertId, name: name.trim(), email: normalizedEmail, role: 'member' };
    return res.status(201).json({ user, token: createToken(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
    }
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  const { email, password } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!normalizedEmail || typeof password !== 'string') {
    return res.status(400).json({ message: 'Informe e-mail e senha.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail],
    );
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos.' });
    }
    return res.json({ user: publicUser(user), token: createToken(user) });
  } catch (error) {
    return next(error);
  }
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
      [req.user.sub],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
});

router.put('/me', requireAuth, async (req, res, next) => {
  const { name, email } = req.body || {};
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 120) {
    return res.status(400).json({ message: 'Informe um nome com 2 a 120 caracteres.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 190) {
    return res.status(400).json({ message: 'Informe um e-mail válido.' });
  }

  try {
    await pool.execute(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [name.trim(), normalizedEmail, req.user.sub],
    );

    const [rows] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
      [req.user.sub],
    );
    if (!rows[0]) return res.status(404).json({ message: 'Usuário não encontrado.' });
    return res.json({ user: publicUser(rows[0]), message: 'Perfil atualizado.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Já existe uma conta com este e-mail.' });
    }
    return next(error);
  }
});

module.exports = router;
