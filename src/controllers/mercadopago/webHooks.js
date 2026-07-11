import axios from "axios"
import Wallet from "../../models/Wallet.js"
import { sendPushSafely } from '../../services/push.service.js'

export const webHooks = async (req, res, next) => {
    const { type, data } = req.body
    try {
        const compra = await axios.get(`https://api.mercadopago.com/v1/payments/${data?.id}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.ACCESS_TOKEN_PROD_MP}`
            }
        })
        if (type === "payment" &&
            compra.data.status === "approved" &&
            compra.data.status_detail === "accredited" &&
            compra.data.metadata.coins_quantity && compra.data.metadata.user_buyer) {
            const wallet = await Wallet.findOne({ user: compra.data.metadata.user_buyer })

            if (!wallet) {
                return res.status(400).json("No se ha encontrado una billetera")
            }
            console.log("WALLET", wallet)

            const coins = Number(compra.data.metadata.coins_quantity)
            const purchaseId = String(compra.data.id)
            if (wallet.historyPurchases.some(item => item.purchaseId === purchaseId)) return res.status(200).send('ok')
            wallet.balance += coins
            if (compra.data.metadata.coins_quantity === 300 && wallet.promotionUsed !== null) {
                wallet.promotionUsed = true
            }
            wallet.historyPurchases.push({
                price: compra.data.metadata.price,
                amount: compra.data.metadata.coins_quantity,
                date: new Date(),
                completed: true,
                purchaseId,
            })
            await wallet.save()
            await sendPushSafely(compra.data.metadata.user_buyer, { title: 'Saldo acreditado', body: coins + ' monedas fueron acreditadas a tu saldo', data: { type: 'balance_credited' } })
        }
        res.status(200).send('ok')
    } catch (error) {
        console.log(error)
        res.status(403).json(error)
        next(error)
    }
}
