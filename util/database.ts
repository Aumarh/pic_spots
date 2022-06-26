import camelCaseKeys from 'camelcase-keys';
import { config } from 'dotenv-safe';
import postgres from 'postgres';

// import setPostgresDefaultsOnHeroku from './setPostgresDefaultsOnHeroku';

config();

// Type needed for the connection function below
declare module globalThis {
  let postgresSqlClient: ReturnType<typeof postgres> | undefined;
}
// Connect only once to the database
function connectOneTimeToDatabase() {
  let sql;

  if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
    // Heroku needs SSL connections but
    // has an "unauthorized" certificate
    // https://devcenter.heroku.com/changelog-items/852
    sql = postgres({ ssl: { rejectUnauthorized: false } });
  } else {
    if (!globalThis.postgresSqlClient) {
      globalThis.postgresSqlClient = postgres();
    }
    sql = globalThis.postgresSqlClient;
  }
  return sql;
}

// Connect to PostgreSQL
const sql = connectOneTimeToDatabase();

export type User = {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  password_hash: string;
};

export type UserWithPasswordHash = User & {
  passwordHash: string;
};

type Session = {
  id: number;
  token: string;
  userId: number;
  expiry_timestamp: Date;
  csrf_token: string;
};

export type Profile = {
  id: number;
  userId: number;
  image: string;
  bio: string;
};

export type Post = {
  id: number;
  userId: number;
  image: string;
  spot_name: string;
  post_description: string;
  location_id: number;
  post_timestamp: Date;
  username: string;
};

export type Comment = {
  id: number;
  userId: number;
  postId: number;
  comment: string;
  post_timestamp: Date;
};

export async function createUser(
  first_name: string,
  last_name: string,
  username: string,
  passwordHash: string,
) {
  const [user] = await sql<[User]>`
  INSERT INTO users
    (first_name, last_name, username, password_hash)
  VALUES
    (${first_name}, ${last_name}, ${username}, ${passwordHash})
  RETURNING
    id,
    username
  `;

  return camelCaseKeys(user);
}