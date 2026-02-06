#!/bin/sh
# entrypoint.sh - Gerenciamento inteligente de memória

echo "========================================"
echo "🚀 ILUNGI GESTORA API - ULTRA LEVE"
echo "========================================"

# Detecta memória disponível
if [ -f /sys/fs/cgroup/memory/memory.limit_in_bytes ]; then
    LIMIT_BYTES=$(cat /sys/fs/cgroup/memory/memory.limit_in_bytes)
    LIMIT_MB=$((LIMIT_BYTES / 1024 / 1024))
    
    echo "📊 Memória disponível: ${LIMIT_MB}MB"
    
    # Ajusta heap baseado na memória disponível
    if [ $LIMIT_MB -le 512 ]; then
        # FREE TIER: configuração ULTRA conservadora
        HEAP_MAX=128
        HEAP_MIN=32
        echo "📈 Config: Free Tier (Heap: ${HEAP_MIN}-${HEAP_MAX}MB)"
    else
        # Mais memória disponível
        HEAP_MAX=$((LIMIT_MB * 40 / 100))
        HEAP_MIN=$((HEAP_MAX / 4))
        echo "📈 Config: Tier Superior (Heap: ${HEAP_MIN}-${HEAP_MAX}MB)"
    fi
else
    # Fallback para valores seguros
    HEAP_MAX=128
    HEAP_MIN=32
    echo "📈 Config: Fallback (Heap: ${HEAP_MIN}-${HEAP_MAX}MB)"
fi

echo "========================================"

# Executa com configurações calculadas
exec java \
    -Xms${HEAP_MIN}m \
    -Xmx${HEAP_MAX}m \
    -XX:+UseSerialGC \
    -XX:+ExitOnOutOfMemoryError \
    -XX:+AlwaysPreTouch \
    -Djava.security.egd=file:/dev/./urandom \
    -Dspring.profiles.active=prod \
    -Dserver.port=10000 \
    -jar app.jar