-- KEYS[1] = zset key
-- ARGV[1] = now_ms
-- ARGV[2] = max_sessions
-- ARGV[3] = expire_ms
-- ARGV[4] = session_id

redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
local c = redis.call('ZCARD', KEYS[1])
if c < tonumber(ARGV[2]) then
  redis.call('ZADD', KEYS[1], ARGV[3], ARGV[4])
  return 1
end
return 0
