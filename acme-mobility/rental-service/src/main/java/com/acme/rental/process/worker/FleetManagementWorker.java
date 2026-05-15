package com.acme.rental.process.worker;

import org.springframework.stereotype.Component;

import com.acme.rental.integration.fleet.FleetManagementClient;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class FleetManagementWorker {

    private final FleetManagementClient fleetManagementClient;

    @JobWorker(type = "startMonitoring")
    public void startMonitoring(ActivatedJob job, @Variable String vehicleId) {
        log.info("[Zeebe] Worker startMonitoring activated for job: {}. vehicleId: {}", job.getKey(), vehicleId);
        
        try {
            fleetManagementClient.startMonitoring(vehicleId);
            log.info("[Zeebe] Completed startMonitoring for vehicleId: {}", vehicleId);
        } catch (Exception e) {
            log.error("Failed to start monitoring for vehicleId: {}. Error: {}", vehicleId, e.getMessage());
            // In a real scenario, we might want to throw a ZeebeBpmnError or let it retry
            throw e;
        }
    }
}
