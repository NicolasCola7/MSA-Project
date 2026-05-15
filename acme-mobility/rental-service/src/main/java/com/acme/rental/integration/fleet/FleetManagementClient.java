package com.acme.rental.integration.fleet;

import org.springframework.web.client.RestTemplate;
import com.acme.rental.integration.fleet.dto.MonitoringRequest;
import com.acme.rental.integration.fleet.dto.MonitoringResponse;

public class FleetManagementClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public FleetManagementClient(RestTemplate restTemplate, String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public MonitoringResponse startMonitoring(String vehicleId) {
        String url = baseUrl + "/monitoring/start";
        MonitoringRequest request = new MonitoringRequest(vehicleId);
        return restTemplate.postForObject(url, request, MonitoringResponse.class);
    }
}
