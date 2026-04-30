package com.acme.rental.controller;

import com.acme.rental.model.Vehicle;
import com.acme.rental.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*") // Risolve il blocco CORS
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping
    public ResponseEntity<VehiclesResponse> getAllVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return ResponseEntity.ok(new VehiclesResponse(vehicles.size(), vehicles));
    }

    public record VehiclesResponse(int count, List<Vehicle> vehicles) {}
}
