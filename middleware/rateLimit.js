// // // backend/middleware/rateLimit.js
// // const buckets = new Map();

// // export const createRateLimit = ({
// //   windowMs = 60 * 1000,
// //   max = 30,
// //   keyPrefix = 'default',
// //   message = 'Too many requests, please slow down.',
// // } = {}) => {
// //   return (req, res, next) => {
// //     // ✅ Use req.admin if it exists (admin routes), else req.user, else IP
// //     const identifier = req.admin?._id || req.user?._id || req.ip;
// //     const key = `${keyPrefix}:${identifier}`;
// //     const now = Date.now();

// //     const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };

// //     if (now > bucket.resetAt) {
// //       bucket.count = 0;
// //       bucket.resetAt = now + windowMs;
// //     }

// //     bucket.count++;
// //     buckets.set(key, bucket);

// //     if (bucket.count > max) {
// //       const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
// //       res.set('Retry-After', String(retryAfter));
// //       return res.status(429).json({
// //         success: false,
// //         error: message,
// //         retryAfter,
// //       });
// //     }

// //     next();
// //   };
// // };

// // // Cleanup stale buckets every 5 min
// // setInterval(() => {
// //   const now = Date.now();
// //   for (const [key, bucket] of buckets.entries()) {
// //     if (now > bucket.resetAt) buckets.delete(key);
// //   }
// // }, 5 * 60 * 1000);








// // new version 24/09/2026

// // backend/middleware/rateLimit.js - PRODUCTION (Upstash Redis)

// import { Redis } from '@upstash/redis';
// import { Ratelimit } from '@upstash/ratelimit';

// // ✅ One shared Redis client
// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN,
// });

// // ✅ Cache limiters by config so we don't recreate them per request
// const limiterCache = new Map();

// const getLimiter = (windowMs, max, keyPrefix) => {
//   const cacheKey = `${keyPrefix}:${windowMs}:${max}`;
//   if (limiterCache.has(cacheKey)) return limiterCache.get(cacheKey);

//   const limiter = new Ratelimit({
//     redis,
//     limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
//     analytics: false,
//     prefix: `rl:${keyPrefix}`,
//   });

//   limiterCache.set(cacheKey, limiter);
//   return limiter;
// };

// export const createRateLimit = ({
//   windowMs = 60 * 1000,
//   max = 30,
//   keyPrefix = 'default',
//   message = 'Too many requests, please slow down.',
// } = {}) => {
//   return async (req, res, next) => {
//     try {
//       // Skip rate limiting if Redis isn't configured (local dev without Upstash)
//       if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
//         return next();
//       }

//       const identifier =
//         req.admin?._id || req.user?._id || req.ip || 'unknown';
//       const key = `${keyPrefix}:${identifier}`;

//       const limiter = getLimiter(windowMs, max, keyPrefix);
//       const { success, limit, remaining, reset } = await limiter.limit(key);

//       res.set('X-RateLimit-Limit', String(limit));
//       res.set('X-RateLimit-Remaining', String(remaining));

//       if (!success) {
//         const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
//         res.set('Retry-After', String(retryAfter));
//         return res.status(429).json({
//           success: false,
//           error: message,
//           retryAfter,
//         });
//       }

//       next();
//     } catch (err) {
//       // If Redis fails, don't lock users out — log and continue
//       console.error('⚠️ Rate limiter error:', err.message);
//       next();
//     }
//   };
// };





// new version 24/9/26
// backend/middleware/rateLimit.js - PRODUCTION
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// ✅ Lazy init — don't crash if env vars are missing (local dev)
let redis = null;
const getRedis = () => {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
};

const limiterCache = new Map();

const getLimiter = (windowMs, max, keyPrefix) => {
  const cacheKey = `${keyPrefix}:${windowMs}:${max}`;
  if (limiterCache.has(cacheKey)) return limiterCache.get(cacheKey);

  const client = getRedis();
  if (!client) return null;

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(max, `${windowMs} ms`),
    analytics: false,
    prefix: `rl:${keyPrefix}`,
  });

  limiterCache.set(cacheKey, limiter);
  return limiter;
};

export const createRateLimit = ({
  windowMs = 60 * 1000,
  max = 30,
  keyPrefix = 'default',
  message = 'Too many requests, please slow down.',
} = {}) => {
  return async (req, res, next) => {
    try {
      const limiter = getLimiter(windowMs, max, keyPrefix);

      // Redis not configured — skip in dev
      if (!limiter) return next();

      const identifier =
        req.admin?._id || req.user?._id || req.ip || 'unknown';
      const key = `${keyPrefix}:${identifier}`;

      const { success, limit, remaining, reset } = await limiter.limit(key);

      res.set('X-RateLimit-Limit', String(limit));
      res.set('X-RateLimit-Remaining', String(remaining));

      if (!success) {
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
          success: false,
          error: message,
          retryAfter,
        });
      }

      next();
    } catch (err) {
      // Fail open — don't lock everyone out if Redis is down
      console.error('⚠️ Rate limiter error:', err.message);
      next();
    }
  };
};
