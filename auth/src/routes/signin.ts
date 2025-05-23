import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import jwt from 'jsonwebtoken';

import { validateRequest } from '@xtptickets/common';
import { User } from '../models/user';
import { Password } from '../services/password';
import { BadRequestError } from '@xtptickets/common';

const router = express.Router();

router.post('/api/users/signin', [
  body('email').isEmail().withMessage('Email must be valid'),
  body('password').trim().notEmpty().withMessage('You must supply a password')
],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError('Invalid credentials');
    }

    const passwordMatch = await Password.compare(existingUser.password, password);
    if (!passwordMatch) {
      throw new BadRequestError('Invalid credentials');
    }


    /** User is now considered to be logged in. Send them a JWT in a cookie */
    const userJwt = jwt.sign({
      // payload
      id: existingUser.id,
      email: existingUser.email
    },
      // secret key
      process.env.JWT_KEY!
    );

    /** Store it on session obj. (เก็บไว้ใน cookie-session)  */
    req.session = {
      jwt: userJwt
    }

    res.status(200).send(existingUser);
  });

export { router as signinRouter };
