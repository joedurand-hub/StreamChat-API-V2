import { Schema, model } from 'mongoose'

const publicationSchema = new Schema({
    title: { type: String,  trim: true },
    content: {
        type: String,  trim: true,
    },
    images: [{
        public_id: String,
        secure_url: String,
    }],
    video: [{
        public_id: String,
        secure_url: String,
    }],
    price: {
        type: Number,  trim: true, default: 0,
    },
    likes: {
        type: Number, default: 0
    },
    liked: [String],
    checkNSFW: { type: Boolean, default: false },
    checkExclusive: { type: Boolean, default: false },
    buyers: {
        type: [String], default: []
    },
    comments: [{
        value: String,
        userName: String,
    }],
    denouncement: [String],
    createdAt: {
        type: Date,
        default: new Date()
    },
    userReceiveVideocall: {
        type: Boolean, 
    },
    userIdCreatorPost: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    userVerified: {
        type: Boolean, default: false
    },
    userName: { type: String },
    profilePicture: { type: String }
}, { timestamps: true, versionKey: false })

export default model('Publication', publicationSchema)