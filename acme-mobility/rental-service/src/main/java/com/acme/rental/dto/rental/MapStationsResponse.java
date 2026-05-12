package com.acme.rental.dto.rental;

import java.util.List;

public record MapStationsResponse(
        List<StationWithVehiclesDTO> stations
) {
}
