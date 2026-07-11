import User from '../../models/User.js'

export const registerPushToken = async (req, res) => {
  const { token, platform = 'unknown', deviceId } = req.body
  if (!token || typeof token !== 'string' || !/^Expo(nent)?PushToken\[/.test(token)) return res.status(400).json({ message: 'Push token inválido.' })
  await User.updateOne({ _id: req.userId }, { $pull: { pushTokens: { $or: [{ token }, ...(deviceId ? [{ deviceId }] : [])] } } })
  await User.updateOne({ _id: req.userId }, { $push: { pushTokens: { token, platform, deviceId, updatedAt: new Date() } } })
  return res.status(200).json({ success: true })
}

export const unregisterPushToken = async (req, res) => {
  const { token, deviceId } = req.body
  await User.updateOne({ _id: req.userId }, { $pull: { pushTokens: token ? { token } : { deviceId } } })
  return res.status(200).json({ success: true })
}
