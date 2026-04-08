package com.acme.rental.service;

import com.acme.rental.model.Vehicle;
import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Core service for vehicle operations.
 *
 * Responsibilities:
 *  1. Return the list of currently available vehicles (mocked in-memory for first draft)
 *  2. Publish a Zeebe message to start the BPMN process when the user opens the map
 *
 * BPMN reference:
 *  - Message start event: "receive map opening"
 *  - Message name:        Message_openingMap
 *  - First service task:  "get available vehicles" (job type: dbOperation)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final ZeebeClient zeebeClient;

    // ---------------------------------------------------------------
    // MOCK DATA — replace with DynamoDB calls in future iterations
    // ---------------------------------------------------------------
    private static final List<Vehicle> MOCK_VEHICLES = List.of(
        Vehicle.builder()
            .id("V001").type("SCOOTER").model("NIU NQi GTs")
            .status("AVAILABLE").batteryLevel(92)
            .latitude(44.4949).longitude(11.3426)
            .stationName("Stazione Centrale").stationId("ST-001")
            .build(),
        Vehicle.builder()
            .id("V002").type("KICK_SCOOTER").model("Xiaomi 4 Pro")
            .status("AVAILABLE").batteryLevel(78)
            .latitude(44.4968).longitude(11.3396)
            .stationName("Piazza Maggiore").stationId("ST-002")
            .build(),
        Vehicle.builder()
            .id("V003").type("CAR").model("Fiat 500e")
            .status("AVAILABLE").batteryLevel(55)
            .latitude(44.5008).longitude(11.3512)
            .stationName("Via Irnerio").stationId("ST-003")
            .build(),
        Vehicle.builder()
            .id("V004").type("SCOOTER").model("Vespa Elettrica")
            .status("AVAILABLE").batteryLevel(88)
            .latitude(44.4901).longitude(11.3303)
            .stationName("Porta San Felice").stationId("ST-004")
            .build(),
        Vehicle.builder()
            .id("V005").type("KICK_SCOOTER").model("Segway Ninebot Max")
            .status("AVAILABLE").batteryLevel(41)
            .latitude(44.5045).longitude(11.3489)
            .stationName("Via delle Lame").stationId("ST-005")
            .build()
    );

    // ---------------------------------------------------------------
    // PUBLIC API
    // ---------------------------------------------------------------

    /**
     * Returns all available vehicles AND publishes the Zeebe message
     * that starts the rental process instance.
     *
     * The correlationKey is the userId so each session maps to exactly
     * one process instance.
     *
     * @param userId the authenticated user's ID (passed from the frontend)
     * @return list of available vehicles
     */
    public List<Vehicle> getAvailableVehicles(String userId) {
        List<Vehicle> available = MOCK_VEHICLES.stream()
            .filter(v -> "AVAILABLE".equals(v.getStatus()))
            .toList();

        log.info("[VehicleService] {} available vehicles found for user {}", available.size(), userId);

        // Trigger the BPMN process asynchronously
        triggerProcessStart(userId, available.size());

        return available;
    }

    // ---------------------------------------------------------------
    // PRIVATE — Zeebe message publication
    // ---------------------------------------------------------------

    /**
     * Publishes the Zeebe message that starts the process instance.
     *
     * BPMN: Message Start Event "receive map opening" → Message_openingMap
     *
     * The correlationKey links this message to the specific user session.
     * If a process instance with that key is already running, Zeebe will
     * use the existing one (idempotency via message buffering).
     */
    private void triggerProcessStart(String userId, int vehicleCount) {
        String correlationKey = userId;

        log.info("[Zeebe] Publishing message 'Message_openingMap' for user {}", userId);

        zeebeClient.newPublishMessageCommand()
            .messageName("Message_openingMap")
            .correlationKey(correlationKey)
            .timeToLive(Duration.ofMinutes(5))
            .variables(Map.of(
                "userId",        userId,
                "vehicleCount",  vehicleCount,
                "requestId",     UUID.randomUUID().toString()
            ))
            .send()
            .exceptionally(ex -> {
                // Non-blocking: log the error but do NOT fail the REST response
                log.error("[Zeebe] Failed to publish message for user {}: {}", userId, ex.getMessage());
                return null;
            });
    }
}
