package com.acme.rental.integration.fleet;

import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;
import com.acme.rental.integration.fleet.dto.MonitoringRequest;
import com.acme.rental.integration.fleet.dto.MonitoringResponse;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class FleetManagementClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public FleetManagementClient(RestTemplate restTemplate, String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public MonitoringResponse startMonitoring(String vehicleId) {
        log.info("[FleetManagementClient] Start monitoring per vehicleId: {}", vehicleId);

        String url = baseUrl + "/monitoring/start";

        ResponseEntity<MonitoringResponse> response = restTemplate.postForEntity(
                url,
                new MonitoringRequest(vehicleId),
                MonitoringResponse.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            log.error("[FleetManagementClient] Gateway ha risposto: {}", response.getStatusCode());
            throw new RuntimeException("FM Gateway error: " + response.getStatusCode());
        }

        log.info("[FleetManagementClient] Monitoring avviato con successo per vehicleId: {}", vehicleId);
        return response.getBody();
    }
}