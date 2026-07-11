import { Schema, model } from 'mongoose'

const callSessionSchema = new Schema({
  caller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  receiver: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pricePerMinute: { type: Number, required: true, min: 0 },
  maxMinutes: { type: Number, required: true, min: 1 },
  billedMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['ringing', 'active', 'rejected', 'ended', 'missed', 'insufficient_balance'], default: 'ringing', index: true },
  acceptedAt: Date,
  endedAt: Date,
  lastHeartbeatAt: Date,
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true, versionKey: false })

export default model('CallSession', callSessionSchema)
