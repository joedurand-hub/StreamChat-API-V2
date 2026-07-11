import User from '../models/User.js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export const sendPushToUser = async (userId, { title, body, data = {}, categoryId, priority = 'high' }) => {
  const user = await User.findById(userId).select('pushTokens expoPushToken')
  if (!user) return []
  const tokens = [...new Set([...(user.pushTokens || []).map(item => item.token), user.expoPushToken].filter(token => typeof token === 'string' && /^Expo(nent)?PushToken\[/.test(token)))]
  if (!tokens.length) return []
  const messages = tokens.map(to => ({ to, title, body, data, sound: 'default', priority, channelId: categoryId === 'incoming_call' ? 'calls' : 'default', categoryId }))
  const response = await fetch(EXPO_PUSH_URL, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(messages), signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error(`Expo Push respondió ${response.status}`)
  return response.json()
}

export const sendPushSafely = (...args) => sendPushToUser(...args).catch(error => {
  console.error('No se pudo enviar push', error.message)
  return []
})
