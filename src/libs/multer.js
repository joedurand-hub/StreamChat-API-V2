import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const destination = path.resolve('uploads')
        fs.mkdirSync(destination, { recursive: true })
        cb(null, destination)
    },
    filename: (_req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase()
        cb(null, `${Date.now()}-${randomUUID()}${extension}`)
    }
});
export default multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024, files: 8 },
    fileFilter: (_req, file, cb) => {
        const allowed = file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
        cb(allowed ? null : new Error('Tipo de archivo no permitido'), allowed)
    }
});
