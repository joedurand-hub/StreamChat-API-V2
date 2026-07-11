import Wallet from '../../models/Wallet.js'
import { sendPushSafely } from '../../services/push.service.js'

// traer todas las wallets y ordenarlas por fecha de las withdrawalRequests y que además
// tranferMade y paymentAcreditedStatus sean false
export const getWalletsWithWithdrawlRequests = async (req, res, next) => {
    try {
        const wallets = await Wallet.find({}).sort({ 'withdrawalRequests.date': 1 }).filter(wallet => {
            return wallet.withdrawalRequests.some(request => request.tranferMade === false && request.paymentAcreditedStatus === false);
        });
        res.status(200).json(wallets);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al obtener las wallets.' });
        next(error);
    }
};

export const updateWithdrawalStatus = async (req, res) => {
    const { status } = req.body
    const allowed = ['requested', 'approved', 'paid', 'rejected']
    if (!allowed.includes(status)) return res.status(400).json({ message: 'Estado inválido.' })
    const wallet = await Wallet.findOne({ _id: req.params.walletId, 'withdrawalRequests._id': req.params.requestId })
    if (!wallet) return res.status(404).json({ message: 'Solicitud no encontrada.' })
    const request = wallet.withdrawalRequests.id(req.params.requestId)
    request.status = status
    request.tranferMade = status === 'paid'
    request.paymentAcreditedStatus = status === 'paid'
    await wallet.save()
    const labels = { requested: 'solicitado', approved: 'aprobado', paid: 'pagado', rejected: 'rechazado' }
    await sendPushSafely(wallet.user, { title: 'Retiro actualizado', body: 'Tu retiro fue ' + labels[status], data: { type: 'withdrawal_status', status } })
    return res.status(200).json({ request })
}
