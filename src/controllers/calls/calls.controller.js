import CallSession from '../../models/CallSession.js'
import User from '../../models/User.js'
import Wallet from '../../models/Wallet.js'
import { sendPushSafely } from '../../services/push.service.js'
import { billActiveCalls } from '../../services/callBilling.service.js'

export const createCall = async (req, res) => {
  if (!req.body.receiverId) return res.status(400).json({ message: 'Falta el destinatario de la llamada.' })
  const receiver = await User.findById(req.body.receiverId)
  const caller = await User.findById(req.userId)
  if (!receiver || !caller) return res.status(404).json({ message: 'Usuario no encontrado.' })
  if (receiver._id.toString() === caller._id.toString()) return res.status(400).json({ message: 'No podés llamarte a vos mismo.' })
  if (!receiver.receiveVideocall) return res.status(409).json({ message: 'El usuario no recibe videollamadas.' })
  const pricePerMinute = Number(receiver.priceVideocall) || 0
  const wallet = await Wallet.findOne({ user: caller._id })
  if (!wallet) return res.status(404).json({ message: 'Billetera no encontrada.' })
  const maxMinutes = pricePerMinute > 0 ? Math.floor(wallet.balance / pricePerMinute) : 60
  if (maxMinutes < 1) return res.status(402).json({ message: 'Saldo insuficiente para un minuto.' })
  const call = await CallSession.create({ caller: caller._id, receiver: receiver._id, pricePerMinute, maxMinutes, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) })
  await sendPushSafely(receiver._id, { title: 'Videollamada entrante', body: `${caller.userName} quiere llamarte`, categoryId: 'incoming_call', data: { type: 'incoming_call', callId: call._id.toString(), callerId: caller._id.toString(), callerName: caller.userName } })
  return res.status(201).json({ call, availableSeconds: maxMinutes * 60 })
}

export const respondCall = async (req, res) => {
  const accepted = req.body.accepted === true
  const call = await CallSession.findOne({ _id: req.params.id, receiver: req.userId, status: 'ringing' })
  if (!call) return res.status(404).json({ message: 'Llamada no disponible.' })
  call.status = accepted ? 'active' : 'rejected'
  if (accepted) { call.acceptedAt = new Date(); call.lastHeartbeatAt = new Date() } else call.endedAt = new Date()
  await call.save()
  const receiver = await User.findById(req.userId).select('userName')
  await sendPushSafely(call.caller, { title: accepted ? 'Llamada aceptada' : 'Llamada rechazada', body: `${receiver?.userName || 'El usuario'} ${accepted ? 'aceptó' : 'rechazó'} la videollamada`, data: { type: accepted ? 'call_accepted' : 'call_rejected', callId: call._id.toString() } })
  return res.status(200).json({ call, availableSeconds: call.maxMinutes * 60 })
}

export const heartbeatCall = async (req, res) => {
  await billActiveCalls()
  const call = await CallSession.findOne({ _id: req.params.id, $or: [{ caller: req.userId }, { receiver: req.userId }] })
  if (!call || call.status === 'ringing') return res.status(404).json({ message: 'Llamada no activa.' })
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - call.acceptedAt.getTime()) / 1000))
  const remainingSeconds = Math.max(0, call.maxMinutes * 60 - elapsedSeconds)
  const shouldEnd = ['ended', 'insufficient_balance', 'rejected'].includes(call.status) || remainingSeconds <= 0
  return res.status(call.status === 'insufficient_balance' ? 402 : 200).json({ remainingSeconds: shouldEnd ? 0 : remainingSeconds, billedMinutes: call.billedMinutes, shouldEnd, status: call.status })
}

export const endCall = async (req, res) => {
  const call = await CallSession.findOneAndUpdate({ _id: req.params.id, $or: [{ caller: req.userId }, { receiver: req.userId }], status: { $in: ['ringing', 'active'] } }, { $set: { status: 'ended', endedAt: new Date() } }, { new: true })
  if (!call) return res.status(404).json({ message: 'Llamada no encontrada.' })
  return res.status(200).json({ call })
}

export const getCall = async (req, res) => {
  const call = await CallSession.findOne({ _id: req.params.id, $or: [{ caller: req.userId }, { receiver: req.userId }] })
  if (!call) return res.status(404).json({ message: 'Llamada no encontrada.' })
  return res.status(200).json({ call })
}
