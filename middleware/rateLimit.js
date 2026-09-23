// backend/middleware/rateLimit.js
const buckets = new Map();

export const createRateLimit = ({
  windowMs = 60 * 1000,
  max = 30,
  keyPrefix = 'default',
  message = 'Too many requests, please slow down.',
} = {}) => {
  return (req, res, next) => {
    // ✅ Use req.admin if it exists (admin routes), else req.user, else IP
    const identifier = req.admin?._id || req.user?._id || req.ip;
    const key = `${keyPrefix}:${identifier}`;
    const now = Date.now();

    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count++;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        success: false,
        error: message,
        retryAfter,
      });
    }

    next();
  };
};

// Cleanup stale buckets every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, 5 * 60 * 1000);