import allowedOrigins from './allowedOrigins';

const corsOptions = {
  origin: (origin, callback) => {
    // do not want to block REST tools or server-to-server requests
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('Error');
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

export default corsOptions
