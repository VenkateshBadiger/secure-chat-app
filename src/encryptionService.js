// src/encryptionService.js

import CryptoJS from 'crypto-js';

// A fixed salt or secret phrase. In a real-world, high-security app,
// you might handle this differently, but for this project, it's fine.
// IMPORTANT: If you change this, all existing messages will be unreadable.
const SECRET_PHRASE = 'a-very-secret-passphrase-that-is-hard-to-guess';

/**
 * Derives a consistent secret key from the room ID.
 * @param {string} roomId - The ID of the chat room.
 * @returns {string} - The derived secret key.
 */
const getSecretKey = (roomId) => {
    // We combine the room ID with our secret phrase to make the key more unique.
    return CryptoJS.SHA256(roomId + SECRET_PHRASE).toString();
};

/**
 * Encrypts a message using AES encryption.
 * @param {string} text - The plaintext message to encrypt.
 * @param {string} roomId - The ID of the chat room, used to derive the key.
 * @returns {string} - The encrypted message as a string.
 */
export const encryptMessage = (text, roomId) => {
    if (!text) return '';
    const secretKey = getSecretKey(roomId);
    const ciphertext = CryptoJS.AES.encrypt(text, secretKey).toString();
    return ciphertext;
};

/**
 * Decrypts a message using AES encryption.
 * @param {string} ciphertext - The encrypted message.
 * @param {string} roomId - The ID of the chat room, used to derive the key.
 * @returns {string} - The decrypted plaintext message.
 */
export const decryptMessage = (ciphertext, roomId) => {
    if (!ciphertext) return '';
    try {
        const secretKey = getSecretKey(roomId);
        const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
        const originalText = bytes.toString(CryptoJS.enc.Utf8);
        return originalText;
    } catch (error) {
        console.error("Decryption failed:", error);
        // If decryption fails, it might be an unencrypted message or corrupted.
        // Return a placeholder or the original text to avoid crashing the app.
        return '[Message could not be decrypted]';
    }
};