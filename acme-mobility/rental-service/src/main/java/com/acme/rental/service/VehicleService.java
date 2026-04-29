package com.acme.rental.service;

import com.acme.rental.model.Vehicle;
import com.acme.rental.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@Service
public class VehicleService {

    private  final VehicleRepository vehicleRepository;
    
    public List<Vehicle> getAvailableVehicles() {
        return vehicleRepository.findAll();
    }
}
