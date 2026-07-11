import User from '../models/User.js'
export const AdminValidator = async (req, res, next) => {
  const user = await User.findById(req.userId).select('role')
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Acceso de administrador requerido.' })
  return next()
}
