import crypto from "node:crypto";
import JWT from "jsonwebtoken";
import { PRIVATE_KEY, PUBLIC_KEY } from "./cert.js";

const PORT = process.env.PORT ?? 8000;
export const ISSUER = `http://localhost:${PORT}`;

export const hashPassword = (password, salt) => {
  return crypto.createHash("sha256").update(password + salt).digest("hex");
};

export const generateSalt = () => {
  return crypto.randomBytes(16).toString("hex");
};

export const verifyPassword = (password, salt, hash) => {
  return hashPassword(password, salt) === hash;
};

export const getLoggedInUsersFromToken = (token) => {
  if (!token) return [];
  try {
    const decoded = JWT.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
    return decoded.loggedInUsers || [];
  } catch {
    return [];
  }
};

export const generateSessionToken = (loggedInUsers) => {
  const now = Math.floor(Date.now() / 1000);
  const claims = { loggedInUsers, exp: now + 3600 * 24 * 7 };
  return JWT.sign(claims, PRIVATE_KEY, { algorithm: "RS256" });
};

export const generateOidcClaims = (user) => {
  const now = Math.floor(Date.now() / 1000);
  return {
    iss: ISSUER,
    sub: user._id.toString(),
    email: user.email,
    email_verified: String(user.emailVerified || false),
    exp: now + 3600,
    given_name: user.firstName ?? "",
    family_name: user.lastName ?? undefined,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    picture: user.profileImageURL ?? undefined,
  };
};

export const generateTokenFromClaims = (claims) => {
  return JWT.sign(claims, PRIVATE_KEY, { algorithm: "RS256" });
};
