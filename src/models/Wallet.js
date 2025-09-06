import { Schema, model } from 'mongoose'

const walletSchema = new Schema({
    balance: {
        type: Number, require: true, trim: true, default: 5,
    },
    promotionUsed: {
        type: Boolean, default: false,
    },
    historyPurchases: [{
        date: { type: Date, default: new Date() },
        price: { type: Number },
        amount: { type: Number },
        completed: { type: Boolean, default: false }
    }],
    coinsTransferred: [{
        amount: {
            type: Number, require: true
        },
        receiver: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: new Date()
        },
    }],
    coinsReceived: [{
        amount: {
            type: Number, require: true
        },
        sender: {
            type: String,
            required: true
        },
        date: {
            type: Date,
            default: new Date()
        },
    }],
    accounts: {
        mercadoPago: {
            email: { type: String, trim: true },
            CVU: {
                type: String, trim: true,
            },
            alias: {
                type: String, trim: true,
            },
        },
        payoneer: {
            email: { type: String, trim: true },
            ACH: {
                type: String, trim: true,
            },
            alias: {
                type: String, trim: true,
            },
        },
        crypto: {
            currency: { type: String, trim: true },
            address: { type: String, trim: true },
        },
        entity: {
            name: {
                type: String, trim: true, default: "Banco - Entidad"
            },
            CBU: {
                type: String, trim: true, default: "0000000000000000000000",
            },
            CVU: {
                type: String, trim: true, default: "0000000000000000000000",
            },
            alias: {
                type: String, required: true, trim: true, default: "gato.perro.loro",
            },
        },
    },
    withdrawalRequests: [{
        amountCoins: {
            type: Number, required: true, trim: true
        },
        amountMoney: {
            type: Number, required: true, trim: true
        },
        currency: {
            type: String, trim: true
        },
        accountSelected: {
            type: String, trim: true,
        },
        comision: {
            type: Number,
        },
        paymentFee: {
            type: Number,
        },
        tranferMade: {
            type: Boolean, default: false,
        },
        paymentAcreditedStatus: {
            type: Boolean, default: false,
        },
        date: {
            type: Date, default: () => new Date(),
        },
    }],
    createdAt: {
        type: Date,
        default: new Date()
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
}, { timestamps: true, versionKey: false })

export default model('Wallet', walletSchema)