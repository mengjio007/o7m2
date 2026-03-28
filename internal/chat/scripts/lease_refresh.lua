-- KEYS[1] = zset key
-- ARGV[1] = now_ms
-- ARGV[2] = expire_ms
-- ARGV[3] = session_id

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
local s = redis.call('ZSCORE', KEYS[1], ARGV[3])
if not s then
  return 0
end
redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3])
return 1
