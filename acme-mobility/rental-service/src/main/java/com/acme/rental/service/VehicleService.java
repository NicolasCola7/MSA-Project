package com.acme.rental.service;

import com.acme.rental.model.Vehicle;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Service per le operazioni sui veicoli.
 *
 * RESPONSABILITÀ UNICA: restituire i veicoli disponibili dal DB (mock in memoria).
 *
 * Non conosce Zeebe, non conosce WebSocket, non conosce il Controller.
 * In produzione: sostituire MOCK_VEHICLES con una query a DynamoDB.
 */
@Slf4j
@Service
public class VehicleService {

    private static final List<Vehicle> MOCK_VEHICLES = List.of(
        Vehicle.builder().id("V001").type("SCOOTER").model("NIU NQi GTs")
            .status("AVAILABLE").batteryLevel(92)
            .latitude(44.4949).longitude(11.3426)
            .stationName("Stazione Centrale").stationId("ST-001").build(),
        Vehicle.builder().id("V002").type("KICK_SCOOTER").model("Xiaomi 4 Pro")
            .status("AVAILABLE").batteryLevel(78)
            .latitude(44.4968).longitude(11.3396)
            .stationName("Piazza Maggiore").stationId("ST-002").build(),
        Vehicle.builder().id("V003").type("CAR").model("Fiat 500e")
            .status("AVAILABLE").batteryLevel(55)
            .latitude(44.5008).longitude(11.3512)
            .stationName("Via Irnerio").stationId("ST-003").build(),
        Vehicle.builder().id("V004").type("SCOOTER").model("Vespa Elettrica")
            .status("AVAILABLE").batteryLevel(88)
            .latitude(44.4901).longitude(11.3303)
            .stationName("Porta San Felice").stationId("ST-004").build(),
        Vehicle.builder().id("V005").type("KICK_SCOOTER").model("Segway Ninebot Max")
            .status("AVAILABLE").batteryLevel(41)
            .latitude(44.5045).longitude(11.3489)
            .stationName("Via delle Lame").stationId("ST-005").build()
    );

    public List<Vehicle> getAvailableVehicles() {
        log.info("[VehicleService] Lettura veicoli disponibili — {} trovati", MOCK_VEHICLES.size());
        return MOCK_VEHICLES;
    }
}
