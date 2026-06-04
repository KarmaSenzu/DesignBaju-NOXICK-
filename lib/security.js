import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const SECURITY_SECRET = process.env.SECURITY_SECRET || 'fallback_security_secret_key_change_in_production';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_jwt_secret_key_change_in_production';

// --- Crypto & Tokens ---

/**
 * Generates a random secure token (e.g. for purchase_token or download_token)
 */
export function generateToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generates an HMAC SHA-256 hash for data integrity
 */
export function generateIntegrityHash(data) {
    // Sort keys so hash is deterministic
    const sortedData = {};
    Object.keys(data).sort().forEach(key => {
        sortedData[key] = data[key];
    });
    
    const dataString = JSON.stringify(sortedData);
    return crypto.createHmac('sha256', SECURITY_SECRET).update(dataString).digest('hex');
}

/**
 * Verifies if the data matches the provided integrity hash
 */
export function verifyIntegrityHash(data, hash) {
    const computedHash = generateIntegrityHash(data);
    return computedHash === hash;
}

// --- JWT Session Management ---

/**
 * Generates a JWT token for user session
 */
export function generateJWT(payload, expiresIn = '2h') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verifies and decodes a JWT token
 */
export function verifyJWT(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// --- Validation & Injection Prevention ---

/**
 * Basic sanitization to prevent XSS (escapes HTML tags)
 */
export function sanitizeInput(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// --- Rate Limiting ---

const rateLimits = new Map();

/**
 * Basic in-memory rate limiting based on IP and endpoint
 * maxRequests per windowMs
 */
export function rateLimitCheck(ip, endpoint, maxRequests = 10, windowMs = 60000) {
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    
    if (!rateLimits.has(key)) {
        rateLimits.set(key, [{ timestamp: now }]);
        return true;
    }
    
    const requests = rateLimits.get(key);
    // Filter requests within the current window
    const validRequests = requests.filter(req => now - req.timestamp < windowMs);
    
    if (validRequests.length >= maxRequests) {
        // Update the map to clear out old requests anyway
        rateLimits.set(key, validRequests);
        return false;
    }
    
    validRequests.push({ timestamp: now });
    rateLimits.set(key, validRequests);
    return true;
}
