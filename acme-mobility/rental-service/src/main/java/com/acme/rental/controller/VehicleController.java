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
 * REST controller for vehicle-related endpoints.
 *
 * This is the first touchpoint: the user opens the ACMEMobility app/map
 * and the frontend calls GET /api/vehicles to see available vehicles.
 *
 * Simultaneously, the backend publishes the Zeebe message that
 * starts the BPMN process instance for this user session.
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")   // allow frontend on different port in dev
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * GET /api/vehicles?userId={userId}
     *
     * Returns the list of available vehicles near the user.
     * Triggers the BPMN process start (Message_openingMap) as a side-effect.
     *
     * In production: userId comes from JWT token, not query param.
     */
    @GetMapping("/vehicles")
    public ResponseEntity<Map<String, Object>> getAvailableVehicles(
            @RequestParam(defaultValue = "user-anonymous") String userId) {

        log.info("[API] GET /api/vehicles called by user={}", userId);

        List<Vehicle> vehicles = vehicleService.getAvailableVehicles(userId);

        return ResponseEntity.ok(Map.of(
            "status",   "ok",
            "count",    vehicles.size(),
            "vehicles", vehicles
        ));
    }

    /**
     * GET /api/health — simple health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of(
            "service", "rental-service",
            "status",  "UP"
        ));
    }
}
