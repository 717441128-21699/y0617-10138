/**
 * 萌宠乐园 - 宠物社区平台 API 服务器
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import multer from 'multer'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import petRoutes from './routes/pets.js'
import qaRoutes from './routes/qa.js'
import healthRoutes from './routes/health.js'
import placeRoutes from './routes/places.js'

import { initMockData } from './db/mockData.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

const uploadsDir = path.join(__dirname, '../uploads')
app.use('/uploads', express.static(uploadsDir))

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, 'pet-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

app.post('/api/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' })
  }
  const fileUrl = `/uploads/${req.file.filename}`
  res.json({ url: fileUrl })
})

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/pets', petRoutes)
app.use('/api/questions', qaRoutes)
app.use('/api/health', healthRoutes)
app.use('/api/places', placeRoutes)

/**
 * health check
 */
app.get(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API 不存在',
  })
})

initMockData()

export default app
