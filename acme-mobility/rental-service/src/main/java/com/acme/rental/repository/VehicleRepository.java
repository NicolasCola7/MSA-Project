package com.acme.rental.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.acme.rental.model.Vehicle;

import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    
    List<Vehicle> findByStatus(String status);

    List<Vehicle> findByStationId(String stationId);
    
    List<Vehicle> findByTypeAndBatteryLevelGreaterThan(String type, Integer batteryLevel);
}