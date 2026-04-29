package com.acme.rental.service;

import com.acme.rental.model.Vehicle;
import com.acme.rental.repository.VehicleRepository;

import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final ZeebeClient zeebeClient;

    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findAll();
    }

    public long initRentalProcess(String userId) {
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

    public void scanQr(String userId, String vehicleId) {
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
}
