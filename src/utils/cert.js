import { readFileSync } from "node:fs";
import path from "node:path";

let privateKey, publicKey;

if (process.env.PRIVATE_KEY && process.env.PUBLIC_KEY) {
  privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
  publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');
} else {
  try {
    privateKey = readFileSync(path.resolve(process.cwd(), "cert", "private-key.pem"), "utf8");
    publicKey = readFileSync(path.resolve(process.cwd(), "cert", "public-key.pub"), "utf8");
  } catch (err) {
    console.error("Warning: Could not find cert files. Make sure PRIVATE_KEY and PUBLIC_KEY environment variables are set.");
  }
}

export const PRIVATE_KEY = privateKey;
export const PUBLIC_KEY = publicKey;