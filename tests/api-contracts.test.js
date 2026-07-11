import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'

process.env.TOKEN_KEY_JWT = 'streamchat-contract-test-key'

const { default: app } = await import('../src/app.js')

let server
let baseUrl
let authToken

before(async () => {
  server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  const { port } = server.address()
  baseUrl = `http://127.0.0.1:${port}`
  authToken = jwt.sign({ _id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_KEY_JWT)
})

after(async () => {
  server.closeAllConnections?.()
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
})

const postJson = (path, body, authenticated = false) => fetch(`${baseUrl}${path}`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    ...(authenticated ? { authToken } : {})
  },
  body: JSON.stringify(body),
  signal: AbortSignal.timeout(5000)
})

test('register rejects incomplete input without querying the database', async () => {
  const response = await postJson('/api/register', { email: 'qa@example.com' })
  assert.equal(response.status, 400)
})

test('protected routes reject missing tokens', async () => {
  const response = await postJson('/api/chat', { recivedId: '507f191e810c19729de860ea' })
  assert.equal(response.status, 401)
})

test('chat rejects a missing recipient before querying the database', async () => {
  const response = await postJson('/api/chat', {}, true)
  assert.equal(response.status, 400)
})

test('coin checkout rejects invalid amounts before contacting Mercado Pago', async () => {
  const response = await postJson('/api/buy-coins', {
    id: '507f1f77bcf86cd799439011',
    price: 0,
    coinsQuantity: 0
  }, true)
  assert.equal(response.status, 400)
})

test('wallet credit rejects invalid and unverifiable purchases', async () => {
  const response = await postJson('/api/update-balance-with-history', {
    coinsPurchased: 0,
    price: 0
  }, true)
  assert.equal(response.status, 410)
})

test('profile updates cannot target another user', async () => {
  const response = await fetch(`${baseUrl}/api/profile/507f191e810c19729de860ea`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authToken },
    body: JSON.stringify({ description: 'not allowed' }),
    signal: AbortSignal.timeout(5000)
  })
  assert.equal(response.status, 403)
})

test('stories require authentication', async () => {
  const response = await fetch(`${baseUrl}/api/stories`, { signal: AbortSignal.timeout(5000) })
  assert.equal(response.status, 401)
})

test('story creation rejects a missing media file before querying the database', async () => {
  const response = await postJson('/api/stories', {}, true)
  assert.equal(response.status, 400)
})

test('push registration rejects malformed Expo tokens', async () => {
  const response = await postJson('/api/push-token', { token: 'invalid' }, true)
  assert.equal(response.status, 400)
})

test('call creation rejects a missing receiver before querying the database', async () => {
  const response = await postJson('/api/calls', {}, true)
  assert.equal(response.status, 400)
})

test('RevenueCat webhook requires its configured authorization', async () => {
  const response = await postJson('/api/webhooks/revenuecat', { event: {} })
  assert.equal(response.status, 401)
})
