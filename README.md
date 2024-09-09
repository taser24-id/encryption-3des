# 3DES Encryption/Decryption API

This Node.js API provides endpoints for encrypting and decrypting data using the 3DES (Triple DES) algorithm. The API also includes message authentication code (MAC) verification to ensure data integrity.

## Features

- **Encryption**: Encrypts data using a randomly generated 24-byte key and the 3DES algorithm.
- **Decryption**: Decrypts encrypted data using the provided key and verifies data integrity using MAC.
- **MAC Generation**: Generates a MAC for encrypted data to ensure its integrity.

## Endpoints

### `/encrypt`

**POST** - Encrypts the provided data.

**Request Body**:
```json
{
  "data": "Hello, World!",
  "keyIndex": 3
}
```

**Response**:
```json
{
  "finalData": "002903...00000000",
  "key": "24-byte hexadecimal key"
}
```

Notes:
`keyIndex` is a value associated with the encryption key.

### `/decrypt`

**POST** - Decrypts the provided encrypted data.

**Request Body**:
```json
{
  "finalData": "002903...00000000",
  "key": "24-byte hexadecimal key"
}
```

**Response**:
```json
{
  "decryptedData": "Hello, World!"
}
```

Notes:
Ensure that the `finalData` and `key` are correctly provided.

## Installation

**1. Clone the repository**:
```sh
git clone https://github.com/taser24-id/encryption-3des.git
```

**2. Navigate to the project directory**:
```sh
cd encryption-3des
```

**3. Install dependencies**:
```sh
npm install
```

**4. Start the server**:
```sh
npm start
```
