package com.acme.rental.controller;

import com.acme.rental.model.Vehicle;
import com.acme.rental.service.VehicleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VehicleController {

    private final VehicleService vehicleService;

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
