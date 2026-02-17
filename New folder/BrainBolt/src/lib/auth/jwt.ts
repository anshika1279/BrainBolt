import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

type TokenPayload = {
  sub: string;
};

export function signToken(userId: string) {
  return jwt.sign({ sub: userId } satisfies TokenPayload, JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
