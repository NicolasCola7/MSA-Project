package com.acme.rental.service;

import com.acme.rental.dto.rental.BookVehicleRequest;
import com.acme.rental.dto.rental.BookVehicleResponse;
import com.acme.rental.dto.rental.InitRentalRequest;
import com.acme.rental.dto.rental.InitRentalResponse;
import com.acme.rental.dto.rental.MapVehiclesResponse;
import com.acme.rental.dto.rental.ScanQrRequest;
import com.acme.rental.dto.rental.ScanQrResponse;
import com.acme.rental.model.Vehicle;
import com.acme.rental.repository.VehicleRepository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RequiredArgsConstructor
@Service
public class RentalService {

    private static final String BPMN_PROCESS_ID = "rental-service-process";
    private static final String ROUTE_MAP = "/map";
    private static final String ROUTE_SCAN = "/scan";
    private static final String ROUTE_BOOK = "/book";
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    private final VehicleRepository vehicleRepository;
    private final ZeebeClient zeebeClient;

    @Value("${camunda.operate.base-url:http://localhost:8081}")
    private String operateBaseUrl;

    public MapVehiclesResponse getMapVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return new MapVehiclesResponse(vehicles.size(), vehicles);
    }

    public InitRentalResponse initializeRentalProcess(InitRentalRequest request) {
        if (request == null || request.userId() == null || request.userId().isBlank()) {
            return new InitRentalResponse(null, false, "userId is required");
        }

        long processInstanceKey = initRentalProcess(request.userId());
        return new InitRentalResponse(processInstanceKey, true, "Rental process initialized");
    }

    public ScanQrResponse scanQr(ScanQrRequest request) {
        if (request == null
                || request.userId() == null || request.userId().isBlank()
                || request.vehicleId() == null || request.vehicleId().isBlank()) {
            return new ScanQrResponse(false, "userId and vehicleId are required");
        }

        scanQr(request.userId(), request.vehicleId());
        return new ScanQrResponse(true, "QR scanned and sent to Zeebe");
    }

    public BookVehicleResponse bookVehicle(BookVehicleRequest request) {
        if (request == null) {
            return new BookVehicleResponse(false, "userId and vehicleId are required", null, null);
        }

        if (request.userId() == null || request.userId().isBlank()
                || request.vehicleId() == null || request.vehicleId().isBlank()) {
            return new BookVehicleResponse(false, "userId and vehicleId are required", request.vehicleId(), request.userId());
        }

        bookVehicle(request.userId(), request.vehicleId());
        return new BookVehicleResponse(
                true,
                "Vehicle booking sent to Zeebe",
                request.vehicleId(),
                request.userId()
        );
    }

    public String getActiveProcessRoute(String userId) {
        return getActiveProcessResume(userId).targetRoute();
    }

    public ProcessResume getActiveProcessResume(String userId) {
        if (userId == null || userId.isBlank()) {
            return new ProcessResume(ROUTE_MAP, null);
        }

        Optional<ActiveProcessState> state = resolveActiveProcessState(userId);
        String route = state
                .map(ActiveProcessState::flowElementId)
                .map(this::mapFlowElementToRoute)
                .orElse(ROUTE_MAP);
        String vehicleId = state
                .map(ActiveProcessState::vehicleId)
                .filter(value -> !value.isBlank())
                .orElse(null);

        return new ProcessResume(route, vehicleId);
    }

    public String getActiveProcessVehicleId(String userId) {
        return getActiveProcessResume(userId).vehicleId();
    }

    private long initRentalProcess(String userId) {
        log.info("[Zeebe] Creazione istanza per userId={}", userId);

        // 1. Crea l'istanza passando userId come variabile (richiesta dall'Event Gateway)
        var processInstanceResult = zeebeClient.newCreateInstanceCommand()
                .bpmnProcessId("rental-service-process")
                .latestVersion()
                .variables(Map.of("userId", userId))
                .send()
                .join();
                
        long key = processInstanceResult.getProcessInstanceKey();
        log.info("[Zeebe] Istanza creata con key={} per userId={}", key, userId);
        return key;
    }

    private void scanQr(String userId, String vehicleId) {
        log.info("[Zeebe] Invio Message_scanQr per userId={}, vehicleId={}", userId, vehicleId);

        // 2. Pubblica il messaggio con TTL
        zeebeClient.newPublishMessageCommand()
                .messageName("Message_scanQr")
                .correlationKey(userId)
                .timeToLive(java.time.Duration.ofMinutes(1))
                .variables(Map.of("vehicleId", vehicleId))
                .send()
                .join();

        log.info("[Zeebe] Messaggio Message_scanQr inviato con successo per userId={}", userId);
    }

    private void bookVehicle(String userId, String vehicleId) {

        log.info("[Zeebe] Invio Message_receiveBooking per userId={}, vehicleId={}", userId, vehicleId);

        zeebeClient.newPublishMessageCommand()
                .messageName("Message_receiveBooking")
                .correlationKey(userId)
                .timeToLive(java.time.Duration.ofMinutes(1))
                .variables(Map.of("vehicleId", vehicleId))
                .send()
                .join();

        log.info("[Zeebe] Messaggio Message_receiveBooking inviato con successo per userId={}", userId);
    }

    private Optional<ActiveProcessState> resolveActiveProcessState(String userId) {
        Optional<String> processInstanceKey = findActiveProcessInstanceKey(userId);

        if (processInstanceKey.isEmpty()) {
            return Optional.empty();
        }

        String key = processInstanceKey.get();
        return findActiveFlowElementId(key)
                .map(flowElementId -> new ActiveProcessState(
                        key,
                        flowElementId,
                        findProcessVariable(key, "vehicleId").orElse(null)
                ));
    }

    private Optional<String> findActiveProcessInstanceKey(String userId) {
        try {
            Map<String, Object> body = Map.of(
                    "filter", Map.of(
                            "bpmnProcessId", BPMN_PROCESS_ID,
                            "state", "ACTIVE",
                            "variables", List.of(Map.of("name", "userId", "value", userId))
                    ),
                    "sort", List.of(Map.of("field", "startDate", "order", "DESC")),
                    "size", 1
            );

            JsonNode response = operateClient()
                    .post()
                    .uri("/v1/process-instances/search")
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return extractFirstItem(response)
                    .flatMap(item -> textValue(item, "key").or(() -> textValue(item, "processInstanceKey")));
        } catch (Exception ex) {
            log.warn("[Operate] Impossibile recuperare istanze attive per userId={}: {}", userId, ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> findActiveFlowElementId(String processInstanceKey) {
        try {
            Map<String, Object> body = Map.of(
                    "filter", Map.of(
                            "processInstanceKey", processInstanceKeyValue(processInstanceKey),
                            "state", "ACTIVE"
                    ),
                    "sort", List.of(Map.of("field", "startDate", "order", "DESC")),
                    "size", 1
            );

            JsonNode response = operateClient()
                    .post()
                    .uri("/v1/flownode-instances/search")
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return extractFirstItem(response).flatMap(item -> textValue(item, "flowNodeId"));
        } catch (Exception ex) {
            log.warn("[Operate] Impossibile recuperare flow node attivo per processInstanceKey={}: {}",
                    processInstanceKey,
                    ex.getMessage());
            return Optional.empty();
        }
    }

    private Optional<String> findProcessVariable(String processInstanceKey, String variableName) {
        try {
            Map<String, Object> body = Map.of(
                    "filter", Map.of(
                            "processInstanceKey", processInstanceKeyValue(processInstanceKey),
                            "name", variableName
                    ),
                    "size", 1
            );

            JsonNode response = operateClient()
                    .post()
                    .uri("/v1/variables/search")
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            return extractFirstItem(response)
                    .flatMap(item -> textValue(item, "value"))
                    .map(this::normalizeOperateVariableValue);
        } catch (Exception ex) {
            log.warn("[Operate] Impossibile recuperare variabile {} per processInstanceKey={}: {}",
                    variableName,
                    processInstanceKey,
                    ex.getMessage());
            return Optional.empty();
        }
    }

    private String mapFlowElementToRoute(String flowElementId) {
        return switch (flowElementId) {
            case "Activity_blockMoney" -> ROUTE_SCAN;
            case "Activity_reserveVehicle" -> ROUTE_BOOK;
            case "Event_1s4mk1a", "Gateway_06ct1j3", "Event_0ptz4qe", "Event_0phdpjg" -> ROUTE_MAP;
            default -> ROUTE_MAP;
        };
    }

    private RestClient operateClient() {
        return RestClient.builder()
                .baseUrl(operateBaseUrl)
                .build();
    }

    private Optional<JsonNode> extractFirstItem(JsonNode response) {
        JsonNode items = response == null ? null : response.path("items");
        if (items == null || !items.isArray() || items.isEmpty()) {
            return Optional.empty();
        }

        return Optional.of(items.get(0));
    }

    private Optional<String> textValue(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return Optional.empty();
        }

        String text = value.asText();
        return text == null || text.isBlank() ? Optional.empty() : Optional.of(text);
    }

    private Object processInstanceKeyValue(String processInstanceKey) {
        try {
            return Long.parseLong(processInstanceKey);
        } catch (NumberFormatException ex) {
            return processInstanceKey;
        }
    }

    private String normalizeOperateVariableValue(String rawValue) {
        try {
            JsonNode parsedValue = OBJECT_MAPPER.readTree(rawValue);
            return parsedValue.isTextual() ? parsedValue.asText() : parsedValue.toString();
        } catch (Exception ex) {
            return rawValue;
        }
    }

    private record ActiveProcessState(
            String processInstanceKey,
            String flowElementId,
            String vehicleId
    ) {
    }

    public record ProcessResume(
            String targetRoute,
            String vehicleId
    ) {
    }
}
