package com.acme.rental.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.acme.rental.model.Vehicle;
import java.util.List;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByStationId(Long stationId);

    List<Vehicle> findByTypeAndBatteryLevelGreaterThan(String type, Integer batteryLevel);

    List<Vehicle> findByStatus(String status);

    List<Vehicle> findByStationIdAndTypeAndStatusOrderByBatteryLevelDesc(Long stationId, String type, String status);
}