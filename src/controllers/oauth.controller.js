import crypto from "node:crypto";
import path from "node:path";
import jose from "node-jose";
import { User, Client, AuthCode } from "../db/schema.js";
import { PUBLIC_KEY } from "../utils/cert.js";
import { 
  verifyPassword,
  getLoggedInUsersFromToken,
  generateSessionToken,
  generateOidcClaims,
  generateTokenFromClaims,
  ISSUER
} from "../utils/auth.utils.js";

export const getOpenIdConfiguration = (req, res) => {
  return res.json({
    issuer: ISSUER,
    authorization_endpoint: `${ISSUER}/o/authorize`,
    userinfo_endpoint: `${ISSUER}/o/userinfo`,
    jwks_uri: `${ISSUER}/.well-known/jwks.json`,
  });
};

export const getJwks = async (_, res) => {
  const key = await jose.JWK.asKey(PUBLIC_KEY, "pem");
  return res.json({ keys: [key.toJSON()] });
};

export const getAuthenticatePage = (req, res) => {
  return res.sendFile(path.resolve("public", "authenticate.html"));
};

export const getAuthorizePage = async (req, res) => {
  const { client_id, redirect_uri, response_type, prompt } = req.query;
  if (!client_id || !redirect_uri || response_type !== "code") {
    return res.redirect('/error.html?msg=Invalid+authorization+request.+Missing+required+parameters.');
  }

  const client = await Client.findOne({ clientId: client_id });
  if (!client) {
    return res.redirect('/error.html?msg=The+application+you+are+trying+to+authorize+has+been+deleted+or+does+not+exist.');
  }

  if (prompt === "login") {
    return res.sendFile(path.resolve("public", "authorize.html"));
  }

  const token = req.cookies.session_token;
  if (token) {
    const loggedInUsers = getLoggedInUsersFromToken(token);
    if (loggedInUsers && loggedInUsers.length > 0) {
      return res.sendFile(path.resolve("public", "account-chooser.html"));
    }
  }

  return res.sendFile(path.resolve("public", "authorize.html"));
};

export const authorize = async (req, res) => {
  const { email, password, client_id, redirect_uri, state } = req.body;

  if (!email || !password || !client_id || !redirect_uri) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const user = await User.findOne({ email });
  if (!user || !user.password || !user.salt || !verifyPassword(password, user.salt, user.password)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const loggedInUsers = getLoggedInUsersFromToken(req.cookies.session_token);

  const userExists = loggedInUsers.find(u => u.id === user._id.toString());
  if (!userExists) {
    loggedInUsers.push({
      id: user._id.toString(),
      email: user.email,
      name: [user.firstName, user.lastName].filter(Boolean).join(" "),
      avatar: (user.firstName || "U").charAt(0).toUpperCase()
    });
  }

  const token = generateSessionToken(loggedInUsers);
  res.cookie("session_token", token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });

  return res.json({ ok: true });
};

export const consent = async (req, res) => {
  const { client_id, redirect_uri, state, selected_user_id } = req.body;
  if (!selected_user_id) return res.status(400).json({ message: "No user selected" });

  const loggedInUsers = getLoggedInUsersFromToken(req.cookies.session_token);
  if (loggedInUsers.length === 0) return res.status(401).json({ message: "Not logged in" });

  const user = loggedInUsers.find(u => u.id === selected_user_id);
  if (!user) return res.status(401).json({ message: "User not logged in" });

  const client = await Client.findOne({ clientId: client_id });
  if (!client || !client.redirectUris.includes(redirect_uri)) {
    return res.status(400).json({ message: "Invalid client or redirect URI." });
  }

  const code = crypto.randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await AuthCode.create({
    code,
    clientId: client_id,
    userId: selected_user_id,
    redirectUri: redirect_uri,
    expiresAt
  });

  let redirectUrl = `${redirect_uri}?code=${code}`;
  if (state) {
    redirectUrl += `&state=${encodeURIComponent(state)}`;
  }

  return res.json({ redirectUrl });
};

export const token = async (req, res) => {
  const { grant_type, code, client_id, client_secret, redirect_uri } = req.body;

  if (grant_type !== "authorization_code") {
    return res.status(400).json({ message: "Unsupported grant type." });
  }

  const client = await Client.findOne({ clientId: client_id });
  if (!client || client.clientSecret !== client_secret) {
    return res.status(401).json({ message: "Invalid client credentials." });
  }

  const authCode = await AuthCode.findOne({ code, clientId: client_id, redirectUri: redirect_uri });
  if (!authCode || authCode.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired authorization code." });
  }

  const user = await User.findById(authCode.userId);
  if (!user) {
    return res.status(400).json({ message: "User not found." });
  }

  const claims = generateOidcClaims(user);
  const idToken = generateTokenFromClaims(claims);
  const accessToken = crypto.randomBytes(32).toString("hex");

  await AuthCode.deleteOne({ _id: authCode._id });

  return res.json({
    access_token: accessToken,
    id_token: idToken,
    token_type: "Bearer",
    expires_in: 3600
  });
};
