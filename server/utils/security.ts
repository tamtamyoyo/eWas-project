/**
 * Security Utilities
 * 
 * This file provides security-related utilities for the server.
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import csrf from 'csurf';
import * as crypto from 'crypto';

// Rate limiting configuration for different endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many login attempts, please try again after 15 minutes',
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs for API
  standardHeaders: true,
  legacyHeaders: false,
});

// Helmet configuration for secure headers
export const secureHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://*.supabase.co"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://api.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false, // May need to be false for certain integrations
  xssFilter: true,
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  dnsPrefetchControl: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: 'same-origin' },
});

// CSRF protection middleware
export const csrfProtection = csrf({ cookie: true });

// Types for CSRF request
interface CSRFRequest extends Request {
  csrfToken(): string;
}

// CSRF error handler
export const handleCSRFError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  
  // Handle CSRF token errors
  return res.status(403).json({
    error: 'Invalid or expired security token. Please refresh the page and try again.'
  });
};

// Generate CSRF token and attach to response
export const generateCSRFToken = (req: Request, res: Response, next: NextFunction) => {
  res.locals.csrfToken = (req as CSRFRequest).csrfToken();
  next();
};

// Generate a secure random token
export const generateSecureToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex');
};

// Hash a password securely
export const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
};

// Verify a password against a hash
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const [salt, key] = hash.split(':');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
};

// Sanitize user input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate email format
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Export middleware for route protection
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  res.status(401).json({ error: 'Authentication required' });
};

// Check user role/permissions (example for checking if user is admin)
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user as any).role === 'admin') {
    return next();
  }
  
  res.status(403).json({ error: 'Insufficient permissions' });
};

// Middleware to add security headers to API responses
export const addSecurityHeaders = (_req: Request, res: Response, next: NextFunction) => {
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}; 