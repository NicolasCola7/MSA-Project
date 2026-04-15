package com.acme.rental.worker;

import com.acme.rental.service.WebSocketSessionRegistry;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.util.List;
import java.util.Map;

/**
 * Worker per il Send Task "return vehicles".
 *
 * BPMN element : Activity_0pxhs71
 * Job type     : returnVehicles
 *
 * RESPONSABILITÀ: leggere vehicleList dalle variabili di processo (iniettate
 * dal Worker precedente) e inviarla al browser via WebSocket.
 *
 * Questo è il percorso corretto in produzione:
 *   Zeebe (variabili) → Worker → WebSocket → Browser
 *
 * Il Worker NON parla con il Controller.
 * Il Worker NON parla con il Service.
 * I dati viaggiano direttamente da Zeebe al browser.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReturnVehiclesWorker {

    private final WebSocketSessionRegistry sessionRegistry;
    private final ObjectMapper             objectMapper;

    @JobWorker(type = "getVehicles")
    public void handleReturnVehicles(final JobClient client, final ActivatedJob job) {

        Map<String, Object> vars   = job.getVariablesAsMap();
        String              userId = (String)  vars.getOrDefault("userId", "unknown");
        List<?>             vehicles = (List<?>) vars.getOrDefault("vehicleList", List.of());
        Integer             count  = (Integer) vars.getOrDefault("vehicleCount", 0);

        log.info("[Worker:returnVehicles] Invio {} veicoli a userId={}", count, userId);

        // ── push WebSocket al browser ─────────────────────────────────────────
        WebSocketSession session = sessionRegistry.getSession(userId);

        if (session != null && session.isOpen()) {
            try {
                String payload = objectMapper.writeValueAsString(Map.of(
                    "type",     "VEHICLES_AVAILABLE",
                    "count",    count,
                    "vehicles", vehicles
                ));
                session.sendMessage(new TextMessage(payload));
                log.info("[Worker:returnVehicles] Push WebSocket inviato a userId={}", userId);
            } catch (Exception e) {
                log.error("[Worker:returnVehicles] Errore push WebSocket per userId={}: {}", userId, e.getMessage());
            }
        } else {
            // la sessione WebSocket non è disponibile (utente disconnesso o timeout)
            // in produzione: si potrebbe fare retry o salvare in cache per recupero successivo
            log.warn("[Worker:returnVehicles] Nessuna sessione WebSocket attiva per userId={}", userId);
        }

        // ── completa il job su Zeebe ──────────────────────────────────────────
        client.newCompleteCommand(job.getKey())
            .variables(Map.of("vehiclesReturnedToUser", session != null && session.isOpen()))
            .send()
            .join();
    }
}
