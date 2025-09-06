import { Schema, model } from 'mongoose';

const codeSchema = new Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 900 }
});

export default model('Code', codeSchema);
