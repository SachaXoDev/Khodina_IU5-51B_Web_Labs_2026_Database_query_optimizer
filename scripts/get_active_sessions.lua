-- ============================================================================
-- Скрипт на языке Lua для получения всех активных сессий пользователей в Redis
-- Курс: Разработка интернет-приложений (РИП / Веб-технологии), МГТУ им. Н.Э. Баумана
-- Соответствует требованию Лекции №6 (слайд 10):
-- "Или написать целый скрипт на языке Lua для получения активных сессий пользователей"
-- ============================================================================
-- Запуск через docker-контейнер Redis:
-- docker exec -i lab_redis redis-cli EVAL "$(cat scripts/get_active_sessions.lua)" 0
--
-- Либо одной строкой:
-- docker exec lab_redis redis-cli EVAL "local keys = redis.call('KEYS', 'session:*') local res = {} for i, k in ipairs(keys) do table.insert(res, k .. ' -> userId: ' .. tostring(redis.call('GET', k)) .. ', ttl: ' .. tostring(redis.call('TTL', k)) .. 's') end return res" 0
-- ============================================================================

local keys = redis.call('KEYS', 'session:*')
local result = {}

for i, key in ipairs(keys) do
    local userId = redis.call('GET', key)
    local ttl = redis.call('TTL', key)
    local sessionId = string.sub(key, 9) -- обрезаем префикс "session:"
    table.insert(result, "Session: " .. sessionId .. " -> UserID: " .. tostring(userId) .. " (TTL: " .. tostring(ttl) .. "s)")
end

return result
