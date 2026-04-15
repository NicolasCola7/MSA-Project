package com.acme.rental.config;

import com.acme.rental.service.WebSocketSessionRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Configurazione WebSocket.
 *
 * Registra l'endpoint ws://localhost:8080/ws/vehicles?userId=xxx
 *
 * Quando il browser apre la connessione su quell'endpoint:
 *   1. afterConnectionEstablished() salva la sessione nel registry
 *   2. I Worker possono ora trovare la sessione e fare push dei dati
 *   3. afterConnectionClosed() rimuove la sessione dal registry
 *
 * Il parametro userId viene estratto dalla query string dell'URL WebSocket.
 */
@Slf4j
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final WebSocketSessionRegistry registry;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry reg) {
        reg.addHandler(new VehicleWebSocketHandler(registry), "/ws/vehicles")
           .setAllowedOrigins("*");  // in produzione: limitare ai domini autorizzati
    }

    // ── Handler inline ────────────────────────────────────────────────────────

    @Slf4j
    @RequiredArgsConstructor
    static class VehicleWebSocketHandler extends TextWebSocketHandler {

        private final WebSocketSessionRegistry registry;

        @Override
        public void afterConnectionEstablished(WebSocketSession session) {
            String userId = extractUserId(session);
            if (userId != null) {
                registry.register(userId, session);
                log.info("[WebSocket] Connessione aperta — userId={} sessionId={}", userId, session.getId());
            } else {
                log.warn("[WebSocket] Connessione senza userId — chiusura");
                try { session.close(); } catch (Exception ignored) {}
            }
        }

        @Override
        public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
            String userId = extractUserId(session);
            if (userId != null) registry.unregister(userId);
            log.info("[WebSocket] Connessione chiusa — userId={} status={}", userId, status);
        }

        private String extractUserId(WebSocketSession session) {
            // l'URL sarà tipo: ws://localhost:8080/ws/vehicles?userId=user-xyz
            String query = session.getUri() != null ? session.getUri().getQuery() : null;
            if (query == null) return null;
            for (String param : query.split("&")) {
                String[] kv = param.split("=", 2);
                if (kv.length == 2 && "userId".equals(kv[0])) return kv[1];
            }
            return null;
        }
    }
}
