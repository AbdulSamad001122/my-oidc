import JWT from "jsonwebtoken";
import { User } from "../db/schema.js";
import { PUBLIC_KEY } from "../utils/cert.js";
import { 
  verifyPassword, 
  generateSalt, 
  hashPassword, 
  getLoggedInUsersFromToken, 
  generateSessionToken, 
  generateOidcClaims, 
  generateTokenFromClaims 
} from "../utils/auth.utils.js";

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  const user = await User.findOne({ email });

  if (!user || !user.password || !user.salt || !verifyPassword(password, user.salt, user.password)) {
    return res.status(401).json({ message: "Invalid email or password." });
  }

  const claims = generateOidcClaims(user);
  const token = generateTokenFromClaims(claims);

  return res.json({ token });
};

export const signUp = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!email || !password || !firstName) {
    return res.status(400).json({ message: "First name, email, and password are required." });
  }

  const existing = await User.findOne({ email }).select("_id");

  if (existing) {
    return res.status(409).json({ message: "An account with this email already exists." });
  }

  const salt = generateSalt();
  const hash = hashPassword(password, salt);

  await User.create({
    firstName,
    lastName: lastName ?? null,
    email,
    password: hash,
    salt,
  });

  return res.status(201).json({ ok: true });
};

export const getUserInfo = async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header." });
  }

  const token = authHeader.split(" ")[1];

  let claims;
  try {
    claims = JWT.verify(token, PUBLIC_KEY, { algorithms: ["RS256"] });
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }

  const user = await User.findById(claims.sub);

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({
    sub: user._id.toString(),
    email: user.email,
    email_verified: user.emailVerified || false,
    given_name: user.firstName,
    family_name: user.lastName,
    name: [user.firstName, user.lastName].filter(Boolean).join(" "),
    picture: user.profileImageURL,
  });
};

export const devLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

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

export const devLogout = (req, res) => {
  res.clearCookie("session_token");
  return res.json({ ok: true });
};

export const getSession = (req, res) => {
  const users = getLoggedInUsersFromToken(req.cookies.session_token);
  return res.json({ users });
};
