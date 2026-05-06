package com.acme.rental.controller;

import com.acme.rental.model.Vehicle;
import com.acme.rental.repository.VehicleRepository;
import com.acme.rental.service.RentalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rentals")
@CrossOrigin(origins = "*")
public class RentalController {

    private final RentalService rentalService;
    private final VehicleRepository vehicleRepository;

    public RentalController(RentalService rentalService, VehicleRepository vehicleRepository) {
        this.rentalService = rentalService;
        this.vehicleRepository = vehicleRepository;
    }

    @GetMapping("/map")
    public ResponseEntity<VehiclesResponse> getMapVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return ResponseEntity.ok(new VehiclesResponse(vehicles.size(), vehicles));
    }

    @PostMapping("/init")
    public ResponseEntity<?> initializeRentalProcess(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }
        long processInstanceKey = rentalService.initRentalProcess(userId);
        return ResponseEntity.ok(Map.of("processInstanceKey", processInstanceKey, "success", true));
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanQr(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String vehicleId = payload.get("vehicleId");

        if (userId == null || vehicleId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and vehicleId are required"));
        }

        rentalService.scanQr(userId, vehicleId);
        return ResponseEntity.ok(Map.of("success", true, "message", "QR scanned and sent to Zeebe"));
    }

    @PostMapping("/book")
    public ResponseEntity<?> bookVehicle(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String vehicleId = payload.get("vehicleId");

        if (userId == null || vehicleId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and vehicleId are required"));
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Vehicle booking request accepted",
                "vehicleId", vehicleId,
                "userId", userId
        ));
    }

    public record VehiclesResponse(int count, List<Vehicle> vehicles) {
    }
}
