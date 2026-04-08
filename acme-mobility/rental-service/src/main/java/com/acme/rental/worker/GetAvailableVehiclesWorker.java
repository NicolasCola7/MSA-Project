package com.acme.rental.worker;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Zeebe Job Worker for the Service Task "get available vehicles".
 *
 * BPMN element : Activity_0tp942k
 * Job type     : dbOperation
 *
 * Fetches the available vehicles from the DB (mocked in-memory here)
 * and injects them as process variables for the next tasks.
 *
 * In production: replace VEHICLE_DATA with a DynamoDB query.
 */
@Slf4j
@Component
public class GetAvailableVehiclesWorker {

    private static final List<Map<String, Object>> VEHICLE_DATA = List.of(
        Map.of("id","V001","type","SCOOTER","model","NIU NQi GTs","batteryLevel",92,"stationName","Stazione Centrale","latitude",44.4949,"longitude",11.3426),
        Map.of("id","V002","type","KICK_SCOOTER","model","Xiaomi 4 Pro","batteryLevel",78,"stationName","Piazza Maggiore","latitude",44.4968,"longitude",11.3396),
        Map.of("id","V003","type","CAR","model","Fiat 500e","batteryLevel",55,"stationName","Via Irnerio","latitude",44.5008,"longitude",11.3512),
        Map.of("id","V004","type","SCOOTER","model","Vespa Elettrica","batteryLevel",88,"stationName","Porta San Felice","latitude",44.4901,"longitude",11.3303),
        Map.of("id","V005","type","KICK_SCOOTER","model","Segway Ninebot Max","batteryLevel",41,"stationName","Via delle Lame","latitude",44.5045,"longitude",11.3489)
    );

    @JobWorker(type = "dbOperation")
    public void handleGetAvailableVehicles(final JobClient client, final ActivatedJob job) {

        String userId    = (String) job.getVariablesAsMap().getOrDefault("userId", "unknown");
        String requestId = (String) job.getVariablesAsMap().getOrDefault("requestId", "n/a");

        log.info("[Worker:dbOperation] Fetching vehicles — userId={} requestId={}", userId, requestId);

        // Simulated DB read — replace with DynamoDB call
        List<Map<String, Object>> available = VEHICLE_DATA;

        log.info("[Worker:dbOperation] Returning {} vehicles to process", available.size());

        client.newCompleteCommand(job.getKey())
            .variables(Map.of(
                "vehicleList",  available,
                "vehicleCount", available.size()
            ))
            .send()
            .join();
    }
}
