import User from '../../models/User.js'
import Wallet from '../../models/Wallet.js'
import Publication from '../../models/Publication.js'
import { addMessage } from '../chat/chat.controller.js'
import { transporter } from "../../libs/nodemailer.js";
import { addNotification } from '../notifications/notifications.controller.js'

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
        const myPostsIds = userBuyer.publications.map(pub => pub._id);

        if (myPostsIds.includes(postId)) {
            console.log("estás intentando autocomprarte")
            return res.status(400).json("No puedes autocomprarte.")
        }

        const walletBuyer = await Wallet.findOne({ user: req.userId })

        if (!userBuyer || !walletBuyer) {
            return res.status(403).json({ message: 'No se han encontrado usuario y/o billetera alguna.' });
        }

        const postToBuy = await Publication.findById({ _id: postId })
        if (!postToBuy) {
            return res.status(400).json({ message: 'El post no existe.' });
        }

        if (walletBuyer.balance < postToBuy.price) {
            return res.status(400).json({ message: 'Saldo insuficiente para adquirir el contenido.' });
        }

        if (postToBuy.userIdCreatorPost === userBuyer._id) {
            return res.status(403).json({ message: 'No puedes autocomprarte.' });
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

        userBuyer.purchases.push(postId)
        postToBuy.buyers.push(userBuyer._id)

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
      const {userId, priceMessage, receivePaidMessage, chatId, senderId, remitterId, text} = req.body

      const userSenderPaidMessage = await User.findById(req.userId)
      if(!userSenderPaidMessage) {
          return res.status(401).json({message: "No ha iniciado sesión"})
      }
      
    if(receivePaidMessage === false) {
        await addMessage(chatId, senderId, remitterId, text, res)
    } else {
    
        if(!userId) {
            return res.status(403).json({message:"No se ha recibido un id"})
        }
        
        const walletSenderPaidMessage = await Wallet.findOne({ user: req.userId })
        if (!walletSenderPaidMessage) {
            return res.status(400).json({message: "No se ha encontrado tu billetera"})
        }
        
        if(priceMessage > walletSenderPaidMessage.balance) {
            return res.status(400).json({message: "No tienes fondos suficientes"})
        }
        
        const userReceiveCoinsForMessage = await User.findById({ _id: userId })
        if(!userReceiveCoinsForMessage) {
        return res.status(400).json({message: "No se ha encontrado al usuario recibidor de las monedas"})
    }
    
    if(priceMessage !== userReceiveCoinsForMessage.priceMessage) {
        return res.status(400).json({message: "Los precios por mensaje no coinciden."})
    }

    const ReceivingUserWallet = await Wallet.findOne({ user: userId })
    if (!ReceivingUserWallet) {
        return res.status(400).json({message: "No se ha encontrado la billetera del usuario receptor de monedas"})
    }
    
    walletSenderPaidMessage.balance = walletSenderPaidMessage.balance - priceMessage
    ReceivingUserWallet.balance = ReceivingUserWallet.balance + priceMessage
    
    const coinsTransferred = {
        amount: priceMessage,
        receiver: userReceiveCoinsForMessage.userName,
    };
    const coinsReceived = {
        amount: priceMessage,
        sender: userSenderPaidMessage.userName,
    };
    
    walletSenderPaidMessage.coinsTransferred = walletSenderPaidMessage.coinsTransferred.concat(coinsTransferred);
    ReceivingUserWallet.coinsReceived = ReceivingUserWallet.coinsReceived.concat(coinsReceived);
    
    const notificationData = {
        userName: userSenderPaidMessage.userName,
        profilePic: userSenderPaidMessage.profilePicture,
        event: `te ha enviado un mensaje por ${priceMessage} moneda${priceMessage === 1
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
        if (!wallet) res.status(400).json("No se ha entrado una billetera")
        res.status(200).json(wallet)

    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error });
        next(error)
    }
}

export const updateBalanceWithHistoryPurchases = async (req, res, next) => {
    try {
            const { coinsPurchased, price  } = req.body
            console.log(coinsPurchased)
            const user = await User.findById(req.userId)
            if(!user) {
                return res.status(401).json({message: "No se ha encontrado al usuario"})
            }
    
            const wallet = await Wallet.findOne({ user: req.userId })
            if (!wallet) res.status(400).json("No se ha entrado una billetera")
            console.log("balance", wallet.balance)

            wallet.balance = wallet.balance + coinsPurchased
            wallet.historyPurchases.push({
                date: new Date(), 
                price: price, 
                amount: coinsPurchased, 
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
