package com.acme.rental.dto.rental;

import com.acme.rental.model.Vehicle;

import java.util.List;

public record MapVehiclesResponse(
        int count,
        List<Vehicle> vehicles
) {
}
