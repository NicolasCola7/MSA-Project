package com.acme.rental.controller;

import com.acme.rental.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Punto di ingresso HTTP per le operazioni sui veicoli.
 *
 * RESPONSABILITÀ UNICA: ricevere la chiamata HTTP, delegare al Service,
 * rispondere IMMEDIATAMENTE con 202 Accepted.
 *
 * Il Controller NON conosce i dati dei veicoli.
 * I dati reali arriveranno al browser in modo asincrono via WebSocket,
 * quando il VehicleService avrà completato il suo task su Zeebe (getVehicles).
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * GET /api/vehicles?userId={userId}
     *
     * Pubblica il messaggio Zeebe che avvia il processo e risponde subito
     * con 202 Accepted. I veicoli arriveranno al browser via WebSocket.
     */
    @GetMapping("/vehicles")
    public ResponseEntity<Map<String, String>> requestAvailableVehicles(
            @RequestParam(defaultValue = "user-anonymous") String userId) {

        log.info("[Controller] GET /api/vehicles — userId={}", userId);

        // delega al Service: pubblica messaggio Zeebe
        vehicleService.requestAvailableVehicles(userId);

        // risponde SUBITO — il canale HTTP si chiude qui
        return ResponseEntity.accepted().body(Map.of(
            "status",  "processing",
            "message", "Richiesta presa in carico. I veicoli arriveranno via WebSocket.",
            "userId",  userId
        ));
    }

    /** GET /api/health — health check */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "rental-service", "status", "UP"));
    }
}
