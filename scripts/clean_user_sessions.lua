-- ============================================================================
-- Скрипт на языке Lua для атомарного удаления всех активных сессий пользователя
-- Курс: Разработка интернет-приложений (РИП / Веб-технологии), МГТУ им. Н.Э. Баумана
-- ============================================================================
-- Запуск:
-- docker exec -i lab_redis redis-cli EVAL "$(cat scripts/clean_user_sessions.lua)" 0 <userId>
-- ============================================================================

local targetUserId = ARGV[1]
if not targetUserId then
    return 0
end

local keys = redis.call('KEYS', 'session:*')
local deletedCount = 0

for i, key in ipairs(keys) do
    local val = redis.call('GET', key)
    if tostring(val) == tostring(targetUserId) then
        redis.call('DEL', key)
        deletedCount = deletedCount + 1
    end
end

return deletedCount
