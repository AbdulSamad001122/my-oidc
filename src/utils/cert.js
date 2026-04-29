import { readFileSync } from "node:fs";
import path from "node:path";

let privateKey, publicKey;

const formatKey = (key) => {
  if (!key) return key;
  let formatted = key.trim();
  
  // Remove wrapping quotes if they exist
  if ((formatted.startsWith('"') && formatted.endsWith('"')) || 
      (formatted.startsWith("'") && formatted.endsWith("'"))) {
    formatted = formatted.slice(1, -1);
  }

  // Replace literal '\n' and '\r' with actual newlines
  formatted = formatted.replace(/\\n/g, '\n').replace(/\\r/g, '');

  // If the key has no newlines but contains headers, it was pasted as a single line
  if (!formatted.includes('\n')) {
    formatted = formatted.replace(/-----BEGIN (RSA )?PRIVATE KEY-----/g, '-----BEGIN $1PRIVATE KEY-----\n');
    formatted = formatted.replace(/-----END (RSA )?PRIVATE KEY-----/g, '\n-----END $1PRIVATE KEY-----');
    formatted = formatted.replace(/-----BEGIN (RSA )?PUBLIC KEY-----/g, '-----BEGIN $1PUBLIC KEY-----\n');
    formatted = formatted.replace(/-----END (RSA )?PUBLIC KEY-----/g, '\n-----END $1PUBLIC KEY-----');
    
    const parts = formatted.split('\n');
    if (parts.length === 3) {
      const base64Part = parts[1].replace(/\s+/g, '');
      const chunked = base64Part.match(/.{1,64}/g)?.join('\n') || '';
      formatted = `${parts[0]}\n${chunked}\n${parts[2]}`;
    }
  }

  return formatted;
};

if (process.env.PRIVATE_KEY && process.env.PUBLIC_KEY) {
  privateKey = formatKey(process.env.PRIVATE_KEY);
  publicKey = formatKey(process.env.PUBLIC_KEY);
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