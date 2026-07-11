import User from '../../models/User.js'
import Wallet from '../../models/Wallet.js'
import Publication from '../../models/Publication.js'
import { addMessage } from '../chat/chat.controller.js'
import { transporter } from "../../libs/nodemailer.js";
import { addNotification } from '../notifications/notifications.controller.js'
import { sendPushSafely } from '../../services/push.service.js'

export const createWithdrawalRequest = async (req, res, next) => {
    try {
        const { amountCoins, amountMoney, date, currency, accountSelected, paymentFee, comision } = req.body
        const user = await User.findById(req.userId)
        if (isNaN(amountCoins) || amountCoins <= 0) {
            return res.status(400).json({ error: "Cantidad de monedas no válida" });
        }
        if (isNaN(amountMoney) || amountMoney <= 0) {
            return res.status(400).json({ error: "Cantidad de dinero no válida" });
        }
        // if (currency.length !== 3) {
        //     return res.status(400).json({ error: "Divisa no válida" });
        // }
        const wallet = await Wallet.findOne({ user: req.userId })
        if (!wallet) {
            return res.status(404).json({ message: 'Billetera no encontrada.' });
        }
        console.log("Request Body:", req.body);
        console.log("User ID:", req.userId);
        console.log("Wallet Found:", wallet);
        
        wallet.withdrawalRequests.push({
            amountCoins,
            amountMoney,
            date,
            // currency,
            // accountSelected,
            // paymentFee,
            // comision,
        })
        await wallet.save()
        await sendPushSafely(user._id, { title: 'Retiro solicitado', body: 'Recibimos tu solicitud de retiro', data: { type: 'withdrawal_status', status: 'requested' } })
        await transporter.sendMail({
            from: 'joeljuliandurand@gmail.com',
            to: `${user?.email}`,
            subject: `Solicitud de retiro.`,
            text: `Hola! Hemos recibido tu solicitud de retiro. Debes responder este email indicando:
            - Nombre completo del titular de la cuenta bancaria (debe coincidir con el nombre registrado en la aplicación).
            - Número de cuenta bancaria
            - Documento de identidad del titular: DNI, CPF, CUIT, Cédula, etc, según el país.
            - Alias (si aplica): Algunas plataformas aceptan alias o códigos simplificados.
            - Banco receptor y sucursal (en caso de que sea necesario).
            - Otras consideraciones: una vez realizado el pago, el tiempo de recepción y monto total recibido (neto) puede variar según el banco y comisiones de transacción.`,            
          })
          console.log("Response Sent: Solicitud de retiro creada!");

        res.status(200).json({message: "Solicitud de retiro creada!"})
    } catch (error) {
        console.log(error)
        res.status(403).json(error);
        next(error)
    }
}

export const buyContentById = async (req, res, next) => {
    try {
        const { postId } = req.body
        if (!postId) {
            return res.status(404).json({ message: 'No se ha recibido un ID.' });
        }
        const userBuyer = await User.findById(req.userId)
        if (!userBuyer) {
            return res.status(403).json({ message: 'No se han encontrado usuario y/o billetera alguna.' });
        }
        const myPostsIds = userBuyer.publications.map(pub => pub.toString());
        if (myPostsIds.includes(postId.toString())) {
            return res.status(400).json({ message: "No puedes autocomprarte." })
        }

        const walletBuyer = await Wallet.findOne({ user: req.userId })
        if (!walletBuyer) return res.status(404).json({ message: 'Billetera no encontrada.' })

        const postToBuy = await Publication.findById({ _id: postId })
        if (!postToBuy) {
            return res.status(400).json({ message: 'El post no existe.' });
        }

        if (walletBuyer.balance < postToBuy.price) {
            return res.status(400).json({ message: 'Saldo insuficiente para adquirir el contenido.' });
        }

        if (postToBuy.userIdCreatorPost?.toString() === userBuyer._id.toString()) {
            return res.status(403).json({ message: 'No puedes autocomprarte.' });
        }
        if (!Number.isFinite(postToBuy.price) || postToBuy.price <= 0) {
            return res.status(400).json({ message: 'Este contenido no requiere compra.' })
        }
        if (userBuyer.purchases.includes(postId.toString()) || postToBuy.buyers.includes(userBuyer._id.toString())) {
            return res.status(200).json({ message: "El contenido ya estaba desbloqueado" })
        }

        const creatorContent = await User.findById({ _id: postToBuy.userIdCreatorPost })

        if (!creatorContent) {
            return res.status(403).json({ message: 'Creador de contenido no encontrado.' });
        }

        const walletCreatorContent = await Wallet.findById({ _id: creatorContent.wallet })
        if (!walletCreatorContent) {
            return res.status(403).json({ message: 'Billetera del creador no encontrada.' });
        }

        walletBuyer.balance = walletBuyer.balance - postToBuy.price
        walletCreatorContent.balance = walletCreatorContent.balance + postToBuy.price

        const coinsTransferred = {
            amount: postToBuy.price,
            receiver: creatorContent.userName,
        };
        const coinsReceived = {
            amount: postToBuy.price,
            sender: userBuyer.userName,
        };

        walletBuyer.coinsTransferred = walletBuyer.coinsTransferred.concat(coinsTransferred);
        walletCreatorContent.coinsReceived = walletCreatorContent.coinsReceived.concat(coinsReceived);

        userBuyer.purchases.addToSet(postId.toString())
        postToBuy.buyers.addToSet(userBuyer._id.toString())

        const notificationData = {
            userName: userBuyer.userName,
            profilePic: userBuyer.profilePicture,
            event: `ha desbloqueado tu contenido por ${postToBuy.price} ${postToBuy.price === 1
                ? "moneda"
                : "monedas"}!`,
                link: postToBuy._id,
                date: new Date(),
                read: false,
            };
        const buyContentIsSuccess = await Promise.all([
            userBuyer.save(), 
            postToBuy.save(), 
            walletBuyer.save(), 
            walletCreatorContent.save(),
            addNotification(creatorContent._id, notificationData)
        ])
        if(buyContentIsSuccess) {
            await sendPushSafely(creatorContent._id, { title: 'Contenido desbloqueado', body: userBuyer.userName + ' desbloqueó tu publicación por ' + postToBuy.price + ' monedas', data: { type: 'content_purchase', postId: postToBuy._id.toString() } })
            console.log("buyContentIsSuccess:", buyContentIsSuccess)
            return res.status(200).json({ message: "Contenido desbloqueado!" })
        }

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error });
        next(error)
    }
}

export const sendPaidMessage = async (req, res, next) => {
  try {
      const {userId, chatId, senderId, remitterId, text, contextType, storyId} = req.body

      const userSenderPaidMessage = await User.findById(req.userId)
      if(!userSenderPaidMessage) {
          return res.status(401).json({message: "No ha iniciado sesión"})
      }
      if (senderId?.toString() !== req.userId.toString()) {
          return res.status(403).json({ message: "El remitente no coincide con la sesión" })
      }
      const recipient = await User.findById(userId || remitterId)
      if (!recipient) return res.status(404).json({ message: 'Usuario destinatario no encontrado' })
      const isPaidMessage = Boolean(recipient.receivePaidMessage)
      const serverPrice = Number(recipient.priceMessage) || 0
      
    if(!isPaidMessage) {
        await sendPushSafely(recipient._id, { title: contextType === 'story_reply' ? 'Respuesta a tu historia' : 'Mensaje nuevo', body: contextType === 'story_reply' ? userSenderPaidMessage.userName + ' respondió tu historia' : userSenderPaidMessage.userName + ' te envió un mensaje', data: { type: contextType === 'story_reply' ? 'story_reply' : 'message', chatId, senderId: userSenderPaidMessage._id.toString(), storyId } })
        await addMessage(chatId, senderId, remitterId, text, res)
    } else {
    
        if(!userId) {
            return res.status(403).json({message:"No se ha recibido un id"})
        }
        
        const walletSenderPaidMessage = await Wallet.findOne({ user: req.userId })
        if (!walletSenderPaidMessage) {
            return res.status(400).json({message: "No se ha encontrado tu billetera"})
        }
        
        const normalizedPrice = serverPrice
        if(!Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
            return res.status(400).json({ message: "Precio de mensaje inválido" })
        }
        if(normalizedPrice > walletSenderPaidMessage.balance) {
            return res.status(400).json({message: "No tienes fondos suficientes"})
        }
        
        const userReceiveCoinsForMessage = recipient
        if(!userReceiveCoinsForMessage) {
        return res.status(400).json({message: "No se ha encontrado al usuario recibidor de las monedas"})
    }
    
    const ReceivingUserWallet = await Wallet.findOne({ user: userId })
    if (!ReceivingUserWallet) {
        return res.status(400).json({message: "No se ha encontrado la billetera del usuario receptor de monedas"})
    }
    
    walletSenderPaidMessage.balance = walletSenderPaidMessage.balance - normalizedPrice
    ReceivingUserWallet.balance = ReceivingUserWallet.balance + normalizedPrice
    
    const coinsTransferred = {
        amount: normalizedPrice,
        receiver: userReceiveCoinsForMessage.userName,
    };
    const coinsReceived = {
        amount: normalizedPrice,
        sender: userSenderPaidMessage.userName,
    };
    
    walletSenderPaidMessage.coinsTransferred = walletSenderPaidMessage.coinsTransferred.concat(coinsTransferred);
    ReceivingUserWallet.coinsReceived = ReceivingUserWallet.coinsReceived.concat(coinsReceived);
    
    const notificationData = {
        userName: userSenderPaidMessage.userName,
        profilePic: userSenderPaidMessage.profilePicture,
        event: `te ha enviado un mensaje por ${normalizedPrice} moneda${normalizedPrice === 1
            ? null
            : "s"}`,
            link: userSenderPaidMessage._id,
            date: new Date(),
            read: false,
        };
       const transactionSuccess = await Promise.all([
            userSenderPaidMessage.save(), 
            walletSenderPaidMessage.save(), 
            userReceiveCoinsForMessage.save(), 
            ReceivingUserWallet.save(), 
            addNotification(userReceiveCoinsForMessage._id, notificationData)
        ])
        if(transactionSuccess) {
            await sendPushSafely(userReceiveCoinsForMessage._id, { title: 'Mensaje pago recibido', body: 'Recibiste un mensaje pago de ' + userSenderPaidMessage.userName, data: { type: 'paid_message', chatId, senderId: userSenderPaidMessage._id.toString() } })
            console.log({transactionSuccess})
            await addMessage(chatId, senderId, remitterId, text, res)
        }
    }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error });
        next(error)
    }
}

export const getWallet = async (req, res, next) => {
    try {
        if (!req.userId) return res.status(401).json("No ha iniciado sesión")

        const wallet = await Wallet.findOne({ user: req.userId })
        if (!wallet) return res.status(404).json("No se ha encontrado una billetera")
        return res.status(200).json(wallet)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error });
        next(error)
    }
}

export const updateBalanceWithHistoryPurchases = async (req, res, next) => {
    return res.status(410).json({ message: 'La acreditación se procesa mediante un webhook verificado.' })
    /* legacy disabled
    try {
            const { coinsPurchased, price, purchaseId } = req.body
            const normalizedCoins = Number(coinsPurchased)
            const normalizedPrice = Number(price)
            if (!Number.isInteger(normalizedCoins) || normalizedCoins <= 0 || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
                return res.status(400).json({ message: "Compra inválida" })
            }
            if (!purchaseId || typeof purchaseId !== 'string') {
                return res.status(400).json({ message: "Falta el identificador de la compra" })
            }
            const user = await User.findById(req.userId)
            if(!user) {
                return res.status(401).json({message: "No se ha encontrado al usuario"})
            }
    
            const wallet = await Wallet.findOne({ user: req.userId })
            if (!wallet) return res.status(404).json("No se ha encontrado una billetera")
            if (wallet.historyPurchases.some(purchase => purchase.purchaseId === purchaseId)) {
                return res.status(200).json({ message: "La compra ya fue acreditada" })
            }

            wallet.balance = wallet.balance + normalizedCoins
            wallet.historyPurchases.push({
                date: new Date(), 
                price: normalizedPrice,
                amount: normalizedCoins,
                purchaseId,
                completed: true
            });

            const balanceUpdated = await wallet.save()
            if(balanceUpdated) { 
                return res.status(200).json({message: "Balance actualizado correctamente."})
            }
      } catch (error) {
          console.log(error)
          res.status(500).json({ message: error });
          next(error)
      }
  } */
}

export const updateWalletWithPromotion = async (req, res, next) => {
    try {

        if (!req.userId) return new Error("No ha iniciado sesión")
        const { balance, promotionUsed, amountCoins, amountMoney, currency, accountSelected, paymentFee, comision } = req.body

        const wallet = await Wallet.findOne({ user: req.userId })
        if (!wallet) res.status(400).json("No se ha entrado una billetera")

        res.status(200).json(wallet)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error });
        next(error)
    }
}

export const bringAllPurchasesByUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        const userPurchases = user?.purchases
        console.log("userPurchases", userPurchases)

        const findPostsPurchases = await Publication.find({
            _id: {
                $in: userPurchases
            }
        })

        const postsPurchases = findPostsPurchases.sort((a, b) => {
            if (a.createdAt < b.createdAt) return 1;
            return -1;
        })

        res.status(200).json(postsPurchases)
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error });
        next(error)
    }
}
