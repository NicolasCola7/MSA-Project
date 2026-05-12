package com.acme.rental.dto.rental;

import com.acme.rental.model.Vehicle;
import java.util.List;

public record StationWithVehiclesDTO(
        Long id,
        String name,
        Double latitude,
        Double longitude,
        List<Vehicle> vehicles
) {
}
