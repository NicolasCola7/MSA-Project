package com.acme.rental.service;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Service per le operazioni sui veicoli.
 *
 * RESPONSABILITÀ:
 * 1. Esporre metodi per i Controller HTTP (es. richiesta apertura mappa).
 * 2. Gestire internamente i task Zeebe triviali legati al DB dei veicoli
 *    (es. getVehicles, checkStatus, updateStatus), accorpandoli nativamente 
 *    per evitare chiamate o classi inutili nel worker layer.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final ZeebeClient zeebeClient;
    private final WebSocketSessionRegistry sessionRegistry;
    private final ObjectMapper objectMapper;

    private static final List<Map<String, Object>> VEHICLE_DATA = List.of(
        Map.of("id","V001","type","SCOOTER","model","NIU NQi GTs","batteryLevel",92,"stationName","Stazione Centrale","latitude",44.4949,"longitude",11.3426),
        Map.of("id","V002","type","KICK_SCOOTER","model","Xiaomi 4 Pro","batteryLevel",78,"stationName","Piazza Maggiore","latitude",44.4968,"longitude",11.3396),
        Map.of("id","V003","type","CAR","model","Fiat 500e","batteryLevel",55,"stationName","Via Irnerio","latitude",44.5008,"longitude",11.3512),
        Map.of("id","V004","type","SCOOTER","model","Vespa Elettrica","batteryLevel",88,"stationName","Porta San Felice","latitude",44.4901,"longitude",11.3303),
        Map.of("id","V005","type","KICK_SCOOTER","model","Segway Ninebot Max","batteryLevel",41,"stationName","Via delle Lame","latitude",44.5045,"longitude",11.3489)
    );

    /**
     * Pubblica il messaggio "Message_openingMap" a Zeebe.
     */
    public void requestAvailableVehicles(String userId) {
        log.info("[Service] Pubblicazione messaggio 'Message_openingMap' per userId={}", userId);

        zeebeClient.newPublishMessageCommand()
            .messageName("Message_openingMap")
            .correlationKey(userId)
            .timeToLive(Duration.ofMinutes(5))
            .variables(Map.of(
                "userId",    userId,
                "requestId", UUID.randomUUID().toString()
            ))
            .send()  // NON bloccante: non aspetta risposta da Zeebe
            .exceptionally(ex -> {
                log.error("[Service] Errore pubblicazione messaggio per userId={}: {}", userId, ex.getMessage());
                return null;
            });

        // il metodo termina qui — nessun dato di ritorno
        log.debug("[Service] Messaggio pubblicato, controllo passato a Zeebe");
    }

    /**
     * Zeebe Job Worker per il Service Task "get available vehicles".
     *
     * BPMN element : Activity_getVehicles
     * Job type     : getVehicles
     */
    @JobWorker(type = "getVehicles")
    public void handleGetAvailableVehicles(final JobClient client, final ActivatedJob job) {

        String userId    = (String) job.getVariablesAsMap().getOrDefault("userId", "unknown");
        String requestId = (String) job.getVariablesAsMap().getOrDefault("requestId", "n/a");

        log.info("[VehicleService:dbOperation] Fetching vehicles — userId={} requestId={}", userId, requestId);

        // Simulated DB read — replace with DynamoDB/JPA call
        List<Map<String, Object>> available = VEHICLE_DATA;

        log.info("[VehicleService:dbOperation] Returning {} vehicles to process", available.size());
        
        // ── push WebSocket al browser ─────────────────────────────────────────
        WebSocketSession session = sessionRegistry.getSession(userId);

        if (session != null && session.isOpen()) {
            try {
                String payload = objectMapper.writeValueAsString(Map.of(
                    "type", "VEHICLES_AVAILABLE",
                    "count", available.size(),
                    "vehicles", available
                ));
                session.sendMessage(new TextMessage(payload));
                log.info("[VehicleService:returnVehicles] Push WebSocket inviato a userId={}", userId);
            } catch (Exception e) {
                log.error("[VehicleService:returnVehicles] Errore push WebSocket per userId={}: {}", userId, e.getMessage());
            }
        } else {
            log.warn("[VehicleService:returnVehicles] Nessuna sessione WebSocket attiva per userId={}", userId);
        }

        // ── completa il job su Zeebe ──────────────────────────────────────────
        client.newCompleteCommand(job.getKey())
            .variables(Map.of("vehiclesReturnedToUser", session != null && session.isOpen()))
            .send()
            .join();
    }
}
