package com.acme.rental.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

import com.acme.rental.integration.fleet.FleetManagementClient;

@Configuration
public class FleetManagementClientConfig {

    @Value("${fleet-management.url:http://fm-gateway:8081}")
    private String fleetManagementUrl;

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Bean
    public FleetManagementClient fleetManagementClient(RestTemplate restTemplate) {
        return new FleetManagementClient(restTemplate, fleetManagementUrl);
    }
}
