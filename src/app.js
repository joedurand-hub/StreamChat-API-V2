import express from "express";
import compression from 'compression';
import hpp from 'hpp';
import xssFilters from 'xss-filters';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from 'morgan';
import cors from 'cors';
import authRoute from './routes/auth.routes.js'
import chatRoute from './routes/chat.routes.js'
import feedRoute from './routes/feed.routes.js'
import followRoute from './routes/follow.routes.js'
import mercadopagoRoute from './routes/mercadopago.routes.js'
import profileRoute from './routes/profile.routes.js'
import searchRoute from './routes/search.routes.js'
import walletRoute from './routes/wallet.routes.js'
import moderationRoute from './routes/moderation.routes.js'
import notificationsRoute from "./routes/notifications.routes.js"
import adminRoute from './routes/admin.routes.js'

dotenv.config()

// Inicialization
const app = express()

var corsOptions = {
    origin: ['exp://192.168.56.58:8081', 'http://localhost:8080', 'http://localhost:8081', 'http://localhost:3000', 'http://localhost:19006', 'http://localhost:19000'],
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Access-Control-Allow-Origin',
        'Access-Control-Allow-Headers',
        'Access-Control-Allow-Credentials',
        'Accept',
        'X-Access-Token',
        'authtoken'
    ],
}


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const helmetConfig = {
    xssFilter: true,
    noSniff: true,
    ieNoOpen: true,
    hsts: {
      maxAge: 15552000,
      includeSubDomains: true
    },
    frameguard: {
      action: 'sameorigin'
    },
    referrerPolicy: { 
      policy: 'same-origin' 
    }
  };

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100, 
    message: 'Demasiadas solicitudes, intenta nuevamente más tarde',
    standardHeaders: true, // Devuelve info de límite en los headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  });

  const xssSanitizerInput = (req, res, next) => {
    // Sanitize req.body
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xssFilters.inHTMLData(req.body[key]);
        }
      }
    }
  
    // Sanitize req.query
    if (req.query) {
      for (const key in req.query) {
        if (typeof req.query[key] === 'string') {
          req.query[key] = xssFilters.inHTMLData(req.query[key]);
        }
      }
    }
  
    // Sanitize req.params
    if (req.params) {
      for (const key in req.params) {
        if (typeof req.params[key] === 'string') {
          req.params[key] = xssFilters.inHTMLData(req.params[key]);
        }
      }
    }
  
    next();
  };

  const addSecurityHeaders = (req, res, next) => {
    // Agregar algunos headers de seguridad adicionales
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    next();
  };


// Settings
app.set('port', process.env.PORT || 8080)

// Middlewares
app.use(compression());
app.use(helmet(helmetConfig))
app.use(addSecurityHeaders)
app.use(limiter);
app.use(hpp());
app.use(xssSanitizerInput);
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true, limit: "250mb" }));
app.use(express.json({ limit: "250mb" }));

// Routes
app.use(authRoute)
app.use(profileRoute)
app.use(feedRoute)
app.use(searchRoute)
app.use(followRoute)
app.use(chatRoute)
app.use(walletRoute)
app.use(mercadopagoRoute)
app.use(moderationRoute)
app.use(notificationsRoute)
app.use(adminRoute)

// Error handler
const errorHandler = (error, req, res, next) => {
    console.error(error)
    res.status(500).json(`Algo ha salido mal: ${error}`)
    next(error)
};
app.use(errorHandler);

// Static files
app.use('/uploads', express.static(path.resolve('uploads')));
app.use(express.static(path.join(__dirname, 'public')));


export default app;