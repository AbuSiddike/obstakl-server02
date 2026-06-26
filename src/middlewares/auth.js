const { sendError } = require('../utils/response');
const { jwtVerify, createRemoteJWKSet } = require('jose-cjs');

const jwt = require('jsonwebtoken');

async function validateToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded) {
      return {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        ...decoded,
      };
    }
  } catch (localErr) {
    // If local verification fails, proceed to JWKS validation
  }

  try {
    const JWKS = createRemoteJWKSet(
      new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
    );
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${process.env.CLIENT_URL}`,
      audience: `${process.env.CLIENT_URL}`,
    });
    return payload;
  } catch (error) {
    console.error('Token validation failed:', error);
    throw error;
  }
}

function extractToken(req) {
  const authorization = req.headers.authorization;
  if (authorization?.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }

  return null;
}

async function verifyToken(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return sendError(res, 401, 'Unauthorized: Access token is missing');
    }

    const payload = await validateToken(token);

    if (!payload.email) {
      return sendError(res, 401, 'Unauthorized: Invalid or expired token');
    }

    req.user = payload;
    next();
  } catch (error) {
    return sendError(res, 401, 'Unauthorized: Invalid or expired token');
  }
}

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Unauthorized: Access token is missing');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Forbidden: Only ${roles.join(' or ')} can perform this action`
      );
    }

    next();
  };
};

module.exports = {
  verifyToken,
  checkRole,
};
