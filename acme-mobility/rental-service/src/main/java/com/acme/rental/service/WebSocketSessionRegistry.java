package com.acme.rental.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Registro delle sessioni WebSocket attive, indicizzate per userId.
 *
 * Quando il browser apre la connessione WebSocket, la sessione viene
 * registrata qui con il suo userId. Quando il Worker ReturnVehiclesWorker
 * vuole inviare i dati al browser, consulta questo registro per trovare
 * la sessione corretta e fare il push.
 *
 * ConcurrentHashMap garantisce thread-safety: Worker e WebSocket handler
 * operano su thread diversi.
 */
@Slf4j
@Component
public class WebSocketSessionRegistry {

    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public void register(String userId, WebSocketSession session) {
        sessions.put(userId, session);
        log.info("[WebSocket] Sessione registrata per userId={}", userId);
    }

    public void unregister(String userId) {
        sessions.remove(userId);
        log.info("[WebSocket] Sessione rimossa per userId={}", userId);
    }

    public WebSocketSession getSession(String userId) {
        return sessions.get(userId);
    }
}
