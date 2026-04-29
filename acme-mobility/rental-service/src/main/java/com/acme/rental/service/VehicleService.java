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

    public void scanQr(String userId) {
        log.info("[Zeebe] Creazione istanza per userId={}", userId);

        // 1. Crea l'istanza passando userId come variabile "reservationId"
        //    → Zeebe la usa per fare il match con la correlationKey del messaggio
        zeebeClient.newCreateInstanceCommand()
            .bpmnProcessId("rental-service-process")
            .latestVersion()
            .variables(Map.of("reservationId", userId))
            .send()
            .join();

        log.info("[Zeebe] Istanza creata, invio Message_scanQr");

        // 2. Pubblica il messaggio — Zeebe trova l'istanza tramite reservationId
        zeebeClient.newPublishMessageCommand()
            .messageName("Message_scanQr")
            .correlationKey(userId)
            .send()
            .join();

        log.info("[Zeebe] Messaggio Message_scanQr inviato per userId={}", userId);
    }
}
