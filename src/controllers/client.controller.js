import crypto from "node:crypto";
import path from "node:path";
import { Client } from "../db/schema.js";
import { getLoggedInUsersFromToken } from "../utils/auth.utils.js";

export const createClient = async (req, res) => {
  const { name, redirectUris } = req.body;
  if (!name || !redirectUris || !Array.isArray(redirectUris)) {
    return res.status(400).json({ message: "Name and redirectUris (array) are required." });
  }

  let userId = null;
  if (name !== 'MyAwesomeApp Demo') {
    const loggedInUsers = getLoggedInUsersFromToken(req.cookies.dev_session_token);
    if (loggedInUsers.length === 0) {
      return res.status(401).json({ message: "Unauthorized. Please log in first." });
    }
    userId = loggedInUsers[0].id;
  }

  const clientId = crypto.randomBytes(16).toString("hex");
  const clientSecret = crypto.randomBytes(32).toString("hex");

  const client = await Client.create({
    name,
    clientId,
    clientSecret,
    redirectUris,
    userId
  });

  return res.status(201).json({
    clientId: client.clientId,
    clientSecret: client.clientSecret,
    name: client.name,
    redirectUris: client.redirectUris
  });
};

export const getClients = async (req, res) => {
  const loggedInUsers = getLoggedInUsersFromToken(req.cookies.dev_session_token);
  if (loggedInUsers.length === 0) {
    return res.status(401).json({ message: "Unauthorized." });
  }

  const userId = loggedInUsers[0].id;
  const clients = await Client.find({ userId });
  return res.json(clients);
};

export const deleteClient = async (req, res) => {
  const loggedInUsers = getLoggedInUsersFromToken(req.cookies.dev_session_token);
  if (loggedInUsers.length === 0) {
    return res.status(401).json({ message: "Unauthorized." });
  }
  
  const userId = loggedInUsers[0].id;
  const { id } = req.params;

  const result = await Client.deleteOne({ clientId: id, userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Client not found or not owned by user." });
  }
  return res.json({ ok: true });
};

export const getClientPage = (req, res) => {
  return res.sendFile(path.resolve("public", "client-registration.html"));
};
