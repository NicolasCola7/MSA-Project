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

import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@Service
public class RentalService {

    private final VehicleRepository vehicleRepository;
    private final ZeebeClient zeebeClient;

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

        return new BookVehicleResponse(
                true,
                "Vehicle booking request accepted",
                request.vehicleId(),
                request.userId()
        );
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
}
