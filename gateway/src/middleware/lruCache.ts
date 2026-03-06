import { Request, Response, NextFunction } from "express";

/*
  This class implements a simple LRU (Least Recently Used) cache.

  Idea:
  - We store API responses in memory.
  - If the same request comes again, we return the cached response
    instead of calling the service again.

  Why LRU?
  When cache becomes full, we remove the item that was used
  the longest time ago.
*/

class LRUCache {
  capacity: number;
  cache: Map<string, any>;

  constructor(capacity: number) {
    // maximum number of items allowed in cache
    this.capacity = capacity;

    /*
      We use JavaScript Map because:
      - it stores items in insertion order
      - operations like get/set/delete are O(1)
    */
    this.cache = new Map();
  }

  get(key: string) {

    /*
      If the key does not exist in cache,
      it means this is a cache miss.
    */
    if (!this.cache.has(key)) {
      return null;
    }

    const value = this.cache.get(key);

    /*
      Move this item to the end of the Map.
      This marks it as the "most recently used".
    */
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  put(key: string, value: any) {

    /*
      If the key already exists, remove it first.
      We will reinsert it as the newest item.
    */
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // store the new value in cache
    this.cache.set(key, value);

    /*
      If cache size exceeds capacity,
      remove the least recently used item.

      In a Map, the first key represents
      the oldest inserted element.
    */
    if (this.cache.size > this.capacity) {

      const firstKey = this.cache.keys().next().value;

      this.cache.delete(firstKey!);
    }
  }
}

/*
  Create a cache instance.
  This means we will store up to 100 responses in memory.
*/
const cache = new LRUCache(100);


/*
  Express middleware for caching API responses.
*/
export const cacheMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  /*
    We only cache GET requests.

    Why?
    GET requests are read-only and safe to cache.

    POST/PUT/DELETE modify data,
    so caching them could return incorrect results.
  */
  if (req.method !== "GET") {
    return next();
  }

  // use request URL as the cache key
  const key = req.originalUrl;

  const cached = cache.get(key);

  /*
    CACHE HIT

    If the response exists in cache,
    return it immediately without calling the service.
  */
  if (cached) {

    // used later by metrics middleware
    (req as any).cacheHit = true;

    return res.json(cached);
  }

  /*
    CACHE MISS

    This means we must fetch data from the service.
  */
  (req as any).cacheHit = false;

  /*
    Save the original res.json function
    so we can intercept the response before sending it.
  */
  const originalJson = res.json.bind(res);

  res.json = (data: any) => {

    /*
      Store the response in cache
      so future requests can reuse it.
    */
    cache.put(key, data);

    // send response normally
    return originalJson(data);
  };

  next();
};