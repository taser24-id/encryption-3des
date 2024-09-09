const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const algorithm = 'des-ede3'; // 3DES algorithm

// Function to create MAC
function createMAC(encryptedBody, key) {
  const lastByte = encryptedBody.slice(-2); // Get the last byte of the encrypted body
  const macFooter = lastByte + 'FFFFFFFFFFFFFF'; // 7-byte padding with 'FF'
  const macCipher = crypto.createCipheriv(algorithm, key, null); // Ensure the key is used
  let mac = macCipher.update(macFooter, 'hex', 'hex');
  mac += macCipher.final('hex');
  return mac;
}

// Function to apply padding
function applyPadding(data) {
  const blockSize = 8; // 3DES block size is 8 bytes
  const padLength = blockSize - (data.length % blockSize);
  const padding = Buffer.alloc(padLength, padLength);
  return Buffer.concat([data, padding]);
}

// Encryption Route
app.post('/encrypt', (req, res) => {
  const { data, keyIndex } = req.body;

  if (!data || !keyIndex) {
    return res.status(400).json({ error: 'Missing data or keyIndex' });
  }

  // Generate a 24-byte key for 3DES
  const key = crypto.randomBytes(24);

  // Convert string to Buffer and apply padding
  let jsonData = Buffer.from(data, 'utf8');
  jsonData = applyPadding(jsonData); // Apply padding

  try {
    // Encrypt the body (3DES-ECB)
    const cipher = crypto.createCipheriv(algorithm, key, null);
    let encryptedBody = cipher.update(jsonData, 'utf8', 'hex');
    encryptedBody += cipher.final('hex');

    // Create MAC
    const mac = createMAC(encryptedBody, key);

    // Create Header (3 bytes)
    const bodyLength = (encryptedBody.length / 2) + 8 + 1; // 1 byte for key index, 8 bytes for MAC
    const header = Buffer.from([(bodyLength >> 8) & 0xff, bodyLength & 0xff, keyIndex]);

    // Combine Header, Encrypted Body, and MAC
    const finalData = header.toString('hex') + encryptedBody + mac;

    res.status(200).json({
      finalData,
      key: key.toString('hex'),
    });
  } catch (error) {
    console.error("Encryption error: ", error);
    res.status(500).json({ error: 'Encryption failed' });
  }
});

// Function to remove padding
function removePadding(data) {
  const padLength = data[data.length - 1]; // The value of the last byte indicates the number of padding bytes
  return data.slice(0, -padLength); // Remove the padding
}

// Decryption Route
app.post('/decrypt', (req, res) => {
  const { finalData, key } = req.body;

  // Ensure key and finalData are present
  if (!finalData || !key) {
    return res.status(400).json({ error: 'Missing finalData or key' });
  }

  try {
    // Convert key to Buffer and validate its length
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== 24) {
      return res.status(400).json({ error: 'Invalid key size for 3DES encryption. Must be 24 bytes.' });
    }

    // Extract Header, Encrypted Body, and MAC from finalData
    const header = finalData.slice(0, 6); // First 3 bytes (6 hex chars)
    const encryptedBody = finalData.slice(6, -32); // Encrypted body (before MAC)
    const receivedMac = finalData.slice(-32); // Last 16 bytes (32 hex chars) as MAC

    // Create decipher for 3DES decryption
    const decipher = crypto.createDecipheriv('des-ede3', keyBuffer, null);
    let decryptedData = decipher.update(encryptedBody, 'hex');
    decryptedData += decipher.final();

    // Remove padding from decrypted data
    decryptedData = removePadding(Buffer.from(decryptedData, 'utf8')).toString('utf8');

    // Recreate the MAC from the encrypted body and compare with the received MAC
    const calculatedMac = createMAC(encryptedBody, keyBuffer);

    if (calculatedMac !== receivedMac) {
      return res.status(400).json({ error: 'MAC verification failed' });
    }

    res.status(200).json({ decryptedData });
  } catch (error) {
    console.error("Decryption error: ", error);
    res.status(500).json({ error: 'Decryption failed' });
  }
});

// Start the server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});