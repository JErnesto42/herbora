const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
const { requireAuth, requireAdmin } = require('../src/middleware/auth');

function requestWithAuthorization(authorization) {
  return { get: () => authorization };
}

test('rejects a request without a bearer token', () => {
  const req = requestWithAuthorization('');
  let nextCalled = false;
  const res = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('rejects an invalid bearer token', () => {
  const req = requestWithAuthorization('Bearer invalid-token');
  let nextCalled = false;
  const res = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('attaches a verified user to the request', () => {
  const token = jwt.sign({ sub: '17', role: 'customer' }, process.env.JWT_SECRET);
  const req = requestWithAuthorization(`Bearer ${token}`);
  const res = {};
  let nextCalled = false;

  requireAuth(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user.sub, '17');
  assert.equal(req.user.role, 'customer');
});

test('blocks customers from administrator actions', () => {
  const req = { user: { role: 'customer' } };
  let nextCalled = false;
  const res = {
    statusCode: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };

  requireAdmin(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('allows an administrator to continue', () => {
  const req = { user: { role: 'admin' } };
  let nextCalled = false;

  requireAdmin(req, {}, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});
