import Wallet from '../../models/Wallet.js'
import { sendPushSafely } from '../../services/push.service.js'

const PRODUCT_COINS = { '100_monedas': 100, '299_monedas': 299, '1060_monedas': 1060, '3800_monedas': 3800, '11250_monedas': 11250 }

export const revenueCatWebhook = async (req, res) => {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTH
  if (!expected || req.header('Authorization') !== expected) return res.status(401).json({ message: 'Webhook no autorizado.' })
  const event = req.body?.event
  if (!event || event.type !== 'NON_RENEWING_PURCHASE') return res.status(200).json({ received: true })
  const coins = PRODUCT_COINS[event.product_id]
  const userId = event.app_user_id
  const purchaseId = event.transaction_id || event.id
  if (!coins || !userId || !purchaseId) return res.status(400).json({ message: 'Evento incompleto.' })
  const wallet = await Wallet.findOne({ user: userId })
  if (!wallet) return res.status(404).json({ message: 'Billetera no encontrada.' })
  if (wallet.historyPurchases.some(item => item.purchaseId === purchaseId)) return res.status(200).json({ duplicate: true })
  wallet.balance += coins
  wallet.historyPurchases.push({ date: new Date(), price: Number(event.price_in_purchased_currency) || 0, amount: coins, purchaseId, completed: true })
  await wallet.save()
  await sendPushSafely(userId, { title: 'Saldo acreditado', body: coins + ' monedas fueron acreditadas a tu saldo', data: { type: 'balance_credited' } })
  return res.status(200).json({ success: true })
}
