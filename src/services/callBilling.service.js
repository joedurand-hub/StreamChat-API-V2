import CallSession from '../models/CallSession.js'
import Wallet from '../models/Wallet.js'
import mongoose from 'mongoose'

export const billActiveCalls = async () => {
  const calls = await CallSession.find({ status: 'active', acceptedAt: { $ne: null } })
  for (const call of calls) {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - call.acceptedAt.getTime()) / 1000))
    const requiredMinutes = call.pricePerMinute > 0 ? Math.min(call.maxMinutes, Math.floor(elapsedSeconds / 60) + 1) : 0
    const minutesToBill = requiredMinutes - call.billedMinutes
    if (minutesToBill > 0) {
      const session = await mongoose.startSession()
      try {
        await session.withTransaction(async () => {
          const claimed = await CallSession.findOneAndUpdate({ _id: call._id, status: 'active', billedMinutes: call.billedMinutes }, { $set: { billedMinutes: requiredMinutes, lastHeartbeatAt: new Date() } }, { new: true, session })
          if (!claimed) return
          const amount = minutesToBill * call.pricePerMinute
          const callerWallet = await Wallet.findOneAndUpdate({ user: call.caller, balance: { $gte: amount } }, { $inc: { balance: -amount }, $push: { coinsTransferred: { amount, receiver: 'Videollamada', date: new Date() } } }, { new: true, session })
          if (!callerWallet) { await CallSession.updateOne({ _id: call._id }, { $set: { status: 'insufficient_balance', endedAt: new Date() } }, { session }); return }
          const receiverResult = await Wallet.updateOne({ user: call.receiver }, { $inc: { balance: amount }, $push: { coinsReceived: { amount, sender: 'Videollamada', date: new Date() } } }, { session })
          if (!receiverResult.matchedCount) throw new Error('Billetera receptora no encontrada')
        })
      } finally { await session.endSession() }
    }
    if (elapsedSeconds >= call.maxMinutes * 60) await CallSession.updateOne({ _id: call._id, status: 'active' }, { $set: { status: 'ended', endedAt: new Date() } })
  }
}
