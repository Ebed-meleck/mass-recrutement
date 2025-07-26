import { config } from 'dotenv';
import log from 'debug';
import  pgPromise from 'pg-promise';
config();
const debug = log('POSTGRES');
const initOptions = {
  // Initialization options
  noWarnings: process.env.NODE_ENV === 'production',

  connect: ({ client, useCount }) => {
    const cp = client.connectionParameters;
    debug(
      `Connected to database: ${cp.database} (use count: ${useCount})`,
    );
  },

  disconnect: ({ client }) => {
    const cp = client.connectionParameters;
    debug(
      `Disconnecting from database: ${cp.database}`
    );
  },

  error: (err, e) => {
    if (e.cn) {
     debug(
        `Connection error: ${err.message || err}`
      );
      debug(
        `Connection details: ${JSON.stringify(e.cn)}`
      );
    } else {
      debug(`Query error: ${err.message || err}`, 'PG_QUERY_ERROR');
    }
  },

  query: (e) => {
    if (process.env.NODE_ENV === 'development') {
       debug(`Query: ${e.query}`);
    }
  },
};

const pgp = pgPromise(initOptions);

// Database connection configuration
const user = process.env.DB_USER;
const password = process.env.DB_PASS;
const host = process.env.DB_HOST;
const port = parseInt(process.env.DB_PORT || 200);
const name = process.env.DB_NAME;

const connectionString = `postgres://${user}:${password}@${host}:${port}/${name}`;
const db = pgp(connectionString);

export default db; 