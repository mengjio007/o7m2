-- KEYS[1] = zset key
-- ARGV[1] = session_id

redis.call('ZREM', KEYS[1], ARGV[1])
return 1
