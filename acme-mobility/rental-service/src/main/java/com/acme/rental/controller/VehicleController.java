package com.acme.rental.controller;

import com.acme.rental.model.Vehicle;
import com.acme.rental.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Punto di ingresso HTTP per le operazioni sui veicoli.
 *
 * GET /api/vehicles → risposta sincrona classica.
 * Nessun Zeebe coinvolto: è una semplice lettura, non un processo orchestrato.
 * Il processo Zeebe parte solo con POST /api/rental/scan (RentalController).
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * GET /api/vehicles
     *
     * Risposta sincrona: restituisce i veicoli disponibili direttamente come JSON.
     * Nessun messaggio Zeebe, nessun WebSocket, nessun 202.
     * Come una normale chiamata REST.
     */
    @GetMapping("/vehicles")
    public ResponseEntity<Map<String, Object>> getAvailableVehicles() {
        log.info("[Controller] GET /api/vehicles");

        List<Vehicle> vehicles = vehicleService.getAvailableVehicles();

        return ResponseEntity.ok(Map.of(
            "status",   "ok",
            "count",    vehicles.size(),
            "vehicles", vehicles
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "rental-service", "status", "UP"));
    }
}
