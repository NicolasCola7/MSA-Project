package com.acme.rental.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents a vehicle in the ACMEMobility fleet.
 * Maps to the Vehicles table in DynamoDB (key-value store).
 * In this first draft the data is in-memory (mocked).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle {

    private String id;

    /** Type: CAR | SCOOTER | KICK_SCOOTER */
    private String type;

    private String model;

    /** Current status: AVAILABLE | RESERVED | IN_RENTAL | IN_MAINTENANCE | RECHARGING */
    private String status;

    /** Battery level 0-100 (%) */
    private int batteryLevel;

    private double latitude;
    private double longitude;

    /** Human-readable station name */
    private String stationName;

    /** Unique station identifier */
    private String stationId;
}
