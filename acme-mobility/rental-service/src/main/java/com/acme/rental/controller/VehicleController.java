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
                "status", "ok",
                "count", vehicles.size(),
                "vehicles", vehicles));
    }

    @PostMapping("/rentals/init")
    public ResponseEntity<Map<String, Object>> initSession() {
        String mockUserId = "mock-user-123";
        long processInstanceKey = vehicleService.initRentalProcess(mockUserId);
        
        log.info("[Controller] POST /api/rentals/init userId={}, processInstanceKey={}", mockUserId, processInstanceKey);
        
        return ResponseEntity.ok(Map.of(
            "status", "success",
            "userId", mockUserId,
            "processInstanceKey", String.valueOf(processInstanceKey)
        ));
    }

    @PostMapping("/rental/scan")
    public ResponseEntity<Map<String, Object>> scanQr(@RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        String vehicleId = body.get("vehicleId");
        
        log.info("[Controller] POST /api/rental/scan userId={}, vehicleId={}", userId, vehicleId);
        
        vehicleService.scanQr(userId, vehicleId);
        
        return ResponseEntity.accepted().body(Map.of(
                "status", "accepted",
                "message", "Scan avviato e messaggio Zeebe pubblicato"
        ));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "rental-service", "status", "UP"));
    }
}
