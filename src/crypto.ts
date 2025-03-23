import { webcrypto } from "crypto";

// #############
// ### Utils ###
// #############

// Function to convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}

// Function to convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  var buff = Buffer.from(base64, "base64");
  return buff.buffer.slice(buff.byteOffset, buff.byteOffset + buff.byteLength);
}

// ################
// ### RSA keys ###
// ################

// Generates a pair of private / public RSA keys
type GenerateRsaKeyPair = {
  publicKey: webcrypto.CryptoKey;
  privateKey: webcrypto.CryptoKey;
};
export async function generateRsaKeyPair(): Promise<GenerateRsaKeyPair> {
  const keyPair = await webcrypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"] // keyUsages
  );
  
  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey
  };
}

// Export a crypto public key to a base64 string format
export async function exportPubKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("spki", key);
  return arrayBufferToBase64(exportedKey);
}

// Export a crypto private key to a base64 string format
export async function exportPrvKey(
  key: webcrypto.CryptoKey | null
): Promise<string | null> {
  if (key === null) return null;
  
  const exportedKey = await webcrypto.subtle.exportKey("pkcs8", key);
  return arrayBufferToBase64(exportedKey);
}

// Import a base64 string public key to its native format
export async function importPubKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyData = base64ToArrayBuffer(strKey);
  
  return await webcrypto.subtle.importKey(
    "spki",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );
}

// Import a base64 string private key to its native format
export async function importPrvKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyData = base64ToArrayBuffer(strKey);
  
  return await webcrypto.subtle.importKey(
    "pkcs8",
    keyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["decrypt"]
  );
}

// Encrypt a message using an RSA public key
export async function rsaEncrypt(
  b64Data: string,
  strPublicKey: string
): Promise<string> {
  const publicKey = await importPubKey(strPublicKey);
  const data = base64ToArrayBuffer(b64Data);
  
  const encryptedData = await webcrypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    publicKey,
    data
  );
  
  return arrayBufferToBase64(encryptedData);
}

// Decrypts a message using an RSA private key
export async function rsaDecrypt(
  data: string,
  privateKey: webcrypto.CryptoKey
): Promise<string> {
  const encryptedData = base64ToArrayBuffer(data);
  
  const decryptedData = await webcrypto.subtle.decrypt(
    {
      name: "RSA-OAEP"
    },
    privateKey,
    encryptedData
  );
  
  return arrayBufferToBase64(decryptedData);
}

// ######################
// ### Symmetric keys ###
// ######################

// Generates a random symmetric key
export async function createRandomSymmetricKey(): Promise<webcrypto.CryptoKey> {
  return await webcrypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256
    },
    true, // extractable
    ["encrypt", "decrypt"] // keyUsages
  );
}

// Export a crypto symmetric key to a base64 string format
export async function exportSymKey(key: webcrypto.CryptoKey): Promise<string> {
  const exportedKey = await webcrypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(exportedKey);
}

// Import a base64 string format to its crypto native format
export async function importSymKey(
  strKey: string
): Promise<webcrypto.CryptoKey> {
  const keyData = base64ToArrayBuffer(strKey);
  
  return await webcrypto.subtle.importKey(
    "raw",
    keyData,
    {
      name: "AES-CBC",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt a message using a symmetric key
export async function symEncrypt(
  key: webcrypto.CryptoKey,
  data: string
): Promise<string> {
  // Generate a random IV (Initialization Vector) - exactly 16 bytes for AES-CBC
  const iv = webcrypto.getRandomValues(new Uint8Array(16));
  
  // Encode the data to a Uint8Array
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  
  // Encrypt the data
  const encryptedData = await webcrypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv: iv
    },
    key,
    dataBuffer
  );
  
  // Combine the IV and encrypted data
  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);
  
  // Return as base64 string
  return arrayBufferToBase64(result);
}

// Decrypt a message using a symmetric key
export async function symDecrypt(
  strKey: string,
  encryptedData: string
): Promise<string> {
  // Import the symmetric key
  const key = await importSymKey(strKey);
  
  // Convert the base64 encrypted data to ArrayBuffer
  const dataBuffer = base64ToArrayBuffer(encryptedData);
  const dataArray = new Uint8Array(dataBuffer);
  
  // Extract the IV (first 16 bytes for AES-CBC)
  const iv = new Uint8Array(dataArray.slice(0, 16));
  
  // Make sure IV is exactly 16 bytes
  if (iv.byteLength !== 16) {
    throw new Error(`Invalid IV length: ${iv.byteLength}. Expected 16 bytes.`);
  }
  
  // Extract the actual encrypted data
  const actualEncrypted = dataArray.slice(16);
  
  try {
    // Decrypt the data
    const decryptedBuffer = await webcrypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv
      },
      key,
      actualEncrypted
    );
    
    // Decode the decrypted data back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption error:", error);
    throw error;
  }
}