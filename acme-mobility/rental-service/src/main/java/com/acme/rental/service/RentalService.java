package com.acme.rental.service;

import com.acme.rental.dto.rental.BookVehicleResponse;
import com.acme.rental.dto.rental.InitRentalRequest;
import com.acme.rental.dto.rental.InitRentalResponse;
import com.acme.rental.dto.rental.ScanQrRequest;
import com.acme.rental.dto.rental.ScanQrResponse;
import com.acme.rental.model.Vehicle;
import com.acme.rental.repository.VehicleRepository;
import com.acme.rental.dto.rental.BookByTypeRequest;
import com.acme.rental.dto.rental.StationWithVehiclesDTO;
import com.acme.rental.dto.rental.MapStationsResponse;
import com.acme.rental.model.Station;
import com.acme.rental.repository.StationRepository;
import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RequiredArgsConstructor
@Service
public class RentalService {

    private final VehicleRepository vehicleRepository;
    private final StationRepository stationRepository;
    private final ZeebeClient zeebeClient;

    public MapStationsResponse getMapStations() {
        List<Station> stations = stationRepository.findAll();

        // Itero su ogni stazione per costruire l'oggetto di risposta
        List<StationWithVehiclesDTO> stationDTOs = stations.stream().map(station -> {

            // Recupero tutti i veicoli collegati a questa specifica stazione
            List<Vehicle> vehicles = vehicleRepository.findByStationId(station.getId());

            // costruisco il dto da ritornare sottoforma di json
            return new StationWithVehiclesDTO(
                    station.getId(),
                    station.getName(),
                    station.getLatitude(),
                    station.getLongitude(),
                    vehicles);
        }).collect(Collectors.toList());
        return new MapStationsResponse(stationDTOs);
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

    public BookVehicleResponse bookVehicleByType(BookByTypeRequest request) {
        if (request == null || request.userId() == null || request.userId().isBlank()
                || request.stationId() == null || request.vehicleType() == null || request.vehicleType().isBlank()) {
            return new BookVehicleResponse(false, "Mancano parametri", null, request != null ? request.userId() : null);
        }

        // Invio SOLO il messaggio a Zeebe
        bookVehicle(request.userId(), request.stationId(), request.vehicleType());

        // Restituisco null (o "PENDING") come vehicleId, perché non è ancora stato
        // assegnato
        return new BookVehicleResponse(
                true,
                "Booking request sent to bank/Zeebe",
                null,
                request.userId());
    }

    private long initRentalProcess(String userId) {
        log.info("[Zeebe] Creazione istanza per userId={}", userId);

        // 1. Crea l'istanza passando userId come variabile (richiesta
        // dall'EventGateway)
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

    private void bookVehicle(String userId, Long stationId, String vehicleType) {
        log.info("[Zeebe] Invio Message_receiveBooking per userId={}, stationId={}, type={}", userId, stationId,
                vehicleType);

        zeebeClient.newPublishMessageCommand()
                .messageName("Message_receiveBooking")
                .correlationKey(userId)
                .timeToLive(java.time.Duration.ofMinutes(1))
                // Passiamo le variabili che serviranno ai worker futuri per assegnare il
                // veicolo
                .variables(Map.of(
                        "requestedStationId", stationId,
                        "requestedVehicleType", vehicleType))
                .send()
                .join();
    }
}
