package com.acme.rental.dto.rental;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ScanQrRequest(
        @JsonProperty("userId") Long userId,
        @JsonProperty("vehicleId") Long vehicleId,
        @JsonProperty("accountId") String accountId
) {
}
