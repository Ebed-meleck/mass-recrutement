import helmet from 'helmet';
import { json, urlencoded } from 'express';
// import session from 'express-session';
import morgan from 'morgan';
import log from 'debug';
// const path = require('path');
import cors from 'cors';
import cookieParser from 'cookie-parser';
import credentials from '../middlewares/credentials';
import corsOptions from './corsOptions';
// import db from '../helpers/db';
// import { handler } from './interceptors';

const debugHTTP = log('http');
// const sessionOptions = {
//   store: new (require('connect-pg-simple')(session))({
//     pgPromise: db
//   }),
//   secret: process.env.COOKIE_SECRET,
//   resave: true,
//   saveUninitialized: true,
//   cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
// };

/**
 * Helmet helps you secure your Express apps
 * by setting various HTTP header
 */
const settingHelmet = {
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: [`'self'`, `'unsafe-inline'`],
      frameSrc: [`'self'`, 'blob:', 'data:'],
      fontSrc: [`'self'`, 'https://fonts.gstatic.com  https://fonts.googleapis.com'],
      imgSrc: [
        `'self'`,
        'blob:',
        'data:',
      ],
      styleSrc: [`'self'`, `'unsafe-inline'`, 'https://fonts.googleapis.com'],
      scriptSrc: [
        `'self'`,
        'blob:',
        'data:',
      ]
    }
  }
};
const useHelmet = helmet(settingHelmet);

/**
 * Morgan
 * HTTP request logger middleware for node.js
 * options: combined | common | dev | short | tiny
 */

const useMorgan = morgan('combined', {
  stream: {
    write: (message) => debugHTTP(message.trim())
  }
});
// const isProduction = process.env.NODE_ENV === 'production';
// const disableTTL = !isProduction;

export function attach(app) {
  // Add morgan logger
  app.use(useMorgan);
  // hide x-powered-by
  app.set('x-powered-by', false);

  // Add server side session
  // app.use(session(sessionOptions));

  // Add helmet
  app.use(useHelmet);

  // Add json body parser
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));

  // Add credentials: MUST BE BEFORE CORS call
  app.use(credentials);

  // Add cors
  app.use(cors(corsOptions));

  // Add cookie parser
  app.use(cookieParser());
}
// configures error handlers
// export function errorHandling(app) {
//   app.use(handler);
// }
