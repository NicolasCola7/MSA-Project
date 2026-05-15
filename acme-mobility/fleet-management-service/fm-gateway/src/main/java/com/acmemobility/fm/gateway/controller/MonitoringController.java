package com.acmemobility.fm.gateway.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.acmemobility.fm.gateway.dto.MonitoringRequest;
import com.acmemobility.fm.gateway.dto.MonitoringResponse;

import acmemobility.battery.Battery;
import acmemobility.battery.BatteryServiceGrpc;
import acmemobility.tracking.Tracking;
import acmemobility.tracking.TrackingServiceGrpc;
import io.grpc.StatusRuntimeException;
import net.devh.boot.grpc.client.inject.GrpcClient;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/monitoring")
public class MonitoringController {

    @GrpcClient("tracking-service")
    private TrackingServiceGrpc.TrackingServiceBlockingStub trackingStub;

    @GrpcClient("battery-service")
    private BatteryServiceGrpc.BatteryServiceBlockingStub batteryStub;

    @PostMapping("/start")
    public ResponseEntity<MonitoringResponse> startMonitoring(@RequestBody MonitoringRequest request) {
        String vehicleId = request.getVehicleId();
        log.info("[startMonitoring] Received start monitoring request for vehicleId: {}", vehicleId);

        try {
            // 1. Call Tracking Service
            Tracking.TrackingRequest trackingRequest = Tracking.TrackingRequest.newBuilder()
                    .setVehicleId(vehicleId)
                    .build();
            trackingStub.startTracking(trackingRequest);
            log.info("[startMonitoring] SUCCESS: Tracking started for vehicleId: {}", vehicleId);

            // 2. Call Battery Service
            Battery.BatteryRequest batteryRequest = Battery.BatteryRequest.newBuilder()
                    .setVehicleId(vehicleId)
                    .build();
            batteryStub.startMonitoring(batteryRequest);
            log.info("[startMonitoring] SUCCESS: Battery monitoring started for vehicleId: {}", vehicleId);

            return ResponseEntity.ok(new MonitoringResponse("STARTED", vehicleId));

        } catch (StatusRuntimeException e) {
            log.error("gRPC call failed: {}", e.getStatus());
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("An error occurred: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
