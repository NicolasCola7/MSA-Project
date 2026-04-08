package com.acme.rental.worker;

import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.client.api.worker.JobClient;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Zeebe Job Worker for the Send Task "return vehicles".
 *
 * BPMN element : Activity_0pxhs71
 * Job type     : returnVehicles
 *
 * In the BPMN this represents the Rental Service sending the vehicle
 * list back to the User (App). In this first draft the REST endpoint
 * has already returned the data synchronously; this worker simply
 * marks the BPMN step complete and logs the outcome.
 *
 * In a production setup this could push the data via WebSocket/SSE.
 */
@Slf4j
@Component
public class ReturnVehiclesWorker {

    @JobWorker(type = "returnVehicles")
    public void handleReturnVehicles(final JobClient client, final ActivatedJob job) {

        Map<String, Object> vars = job.getVariablesAsMap();
        String  userId    = (String)  vars.getOrDefault("userId", "unknown");
        Integer count     = (Integer) vars.getOrDefault("vehicleCount", 0);
        List<?> vehicles  = (List<?>)  vars.getOrDefault("vehicleList", List.of());

        log.info("[Worker:returnVehicles] Sending {} vehicles to user={}", count, userId);

        client.newCompleteCommand(job.getKey())
            .variables(Map.of("vehiclesReturnedToUser", true))
            .send()
            .join();

        log.info("[Worker:returnVehicles] Step complete for user={}", userId);
    }
}
