import { Schema, model } from 'mongoose'

const storySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  userName: { type: String, required: true },
  profilePicture: { type: String },
  mediaUrl: { type: String, required: true },
  filePath: { type: String, required: true, select: false },
  mediaType: { type: String, enum: ['image', 'video'], required: true },
  denouncements: { type: [String], default: [] },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true, versionKey: false })

export default model('Story', storySchema)
