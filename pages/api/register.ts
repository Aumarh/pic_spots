import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { NextApiRequest, NextApiResponse } from 'next';
import { createCSRFSecret } from '../../util/auth';
import { createSerializedRegisterSessionTokenCookie } from '../../util/cookies';
import {
  createSession,
  createUser,
  getUserByUsername,
} from '../../util/database';

export type RegisterResponseBody =
  | {
      errors: {
        message: string;
      }[];
    }
  | { user: { id: number } };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegisterResponseBody>,
) {
  // check the method post
  if (req.method === 'POST') {
    if (
      typeof req.body.firstName !== 'string' ||
      typeof req.body.lastName !== 'string' ||
      typeof req.body.username !== 'string' ||
      typeof req.body.password !== 'string' ||
      typeof req.body.bio !== 'string' ||
      typeof req.body.hero_image !== 'string' ||
      !req.body.firstName ||
      !req.body.lastName ||
      !req.body.username ||
      !req.body.password ||
      !req.body.bio ||
      !req.body.heroImage
    ) {
      res
        .status(401)
        .json({ errors: [{ message: 'name or password not provided' }] });
      return;
    }

    // adding extra checks and constraints

    if (await getUserByUsername(req.body.username)) {
      res.status(401).json({ errors: [{ message: 'username already taken' }] });
      return;
    }
    // hash the password
    const passwordHash = await bcrypt.hash(req.body.password, 12);

    // create the user
    const newUser = await createUser(
      req.body.firstName,
      req.body.lastName,
      req.body.username,
      passwordHash,
      req.body.bio,
      req.body.heroImage,
    );

    // create a session token for the user
    const token = crypto.randomBytes(80).toString('base64');

    // create a secret for the user
    const csrfSecret = createCSRFSecret();

    // save the token to the database
    const session = await createSession(token, newUser.id, csrfSecret);

    const serializedCookie = await createSerializedRegisterSessionTokenCookie(
      session.token,
    );

    res
      .status(200)
      // Tells the browser to create the cookie for us
      .setHeader('set-Cookie', serializedCookie)
      .json({ user: { id: newUser.id } });
  } else {
    res.status(405).json({ errors: [{ message: 'method not allowed' }] });
  }
}
