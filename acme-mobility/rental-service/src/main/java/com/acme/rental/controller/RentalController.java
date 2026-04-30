package com.acme.rental.controller;

import com.acme.rental.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "*") // Abilita CORS per tutto il controller
public class RentalController {

    @Autowired
    private VehicleService vehicleService;

    // Utilizzato durante il login per istanziare il processo Zeebe
    @PostMapping("/api/rentals/init")
    public ResponseEntity<?> initRental(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId is required"));
        }
        long processInstanceKey = vehicleService.initRentalProcess(userId);
        return ResponseEntity.ok(Map.of("processInstanceKey", processInstanceKey, "success", true));
    }

    // Utilizzato quando si scansiona il QR code
    @PostMapping("/api/rental/scan")
    public ResponseEntity<?> scanQr(@RequestBody Map<String, String> payload) {
        String userId = payload.get("userId");
        String vehicleId = payload.get("vehicleId");
        
        if (userId == null || vehicleId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and vehicleId are required"));
        }
        
        vehicleService.scanQr(userId, vehicleId);
        return ResponseEntity.ok(Map.of("success", true, "message", "QR scanned and sent to Zeebe"));
    }
}
