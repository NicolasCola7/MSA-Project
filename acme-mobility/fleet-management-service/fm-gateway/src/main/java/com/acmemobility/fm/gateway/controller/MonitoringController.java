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
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.client.inject.GrpcClient;
import lombok.extern.slf4j.Slf4j;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Slf4j
@RestController
@RequestMapping("/monitoring")
public class MonitoringController {

    @GrpcClient("tracking-service")
    private TrackingServiceGrpc.TrackingServiceStub trackingStub;

    @GrpcClient("battery-service")
    private BatteryServiceGrpc.BatteryServiceStub batteryStub;

    @PostMapping("/start")
    public ResponseEntity<MonitoringResponse> startMonitoring(@RequestBody MonitoringRequest request) {
        String vehicleId = request.getVehicleId();
        log.info("[startMonitoring] Received start monitoring request for vehicleId: {}", vehicleId);

        try {
            // 1. Prepare Tracking Request
            Tracking.TrackingRequest trackingRequest = Tracking.TrackingRequest.newBuilder()
                    .setVehicleId(vehicleId)
                    .build();

            // 2. Prepare Battery Request
            Battery.BatteryRequest batteryRequest = Battery.BatteryRequest.newBuilder()
                    .setVehicleId(vehicleId)
                    .build();

            // 3. Initiate parallel calls using CompletableFuture
            CompletableFuture<Tracking.TrackingAck> trackingFuture = new CompletableFuture<>();
            trackingStub.startTracking(trackingRequest, new StreamObserver<Tracking.TrackingAck>() {
                @Override
                public void onNext(Tracking.TrackingAck value) {
                    trackingFuture.complete(value);
                }

                @Override
                public void onError(Throwable t) {
                    trackingFuture.completeExceptionally(t);
                }

                @Override
                public void onCompleted() {
                }
            });

            CompletableFuture<Battery.BatteryAck> batteryFuture = new CompletableFuture<>();
            batteryStub.startMonitoring(batteryRequest, new StreamObserver<Battery.BatteryAck>() {
                @Override
                public void onNext(Battery.BatteryAck value) {
                    batteryFuture.complete(value);
                }

                @Override
                public void onError(Throwable t) {
                    batteryFuture.completeExceptionally(t);
                }

                @Override
                public void onCompleted() {
                }
            });

            // 4. Wait for both to complete
            CompletableFuture.allOf(trackingFuture, batteryFuture).get();

            log.info("[startMonitoring] SUCCESS: Both tracking and battery monitoring started for vehicleId: {}",
                    vehicleId);
            return ResponseEntity.ok(new MonitoringResponse("STARTED", vehicleId));

        } catch (ExecutionException e) {
            Throwable cause = e.getCause();
            if (cause instanceof StatusRuntimeException) {
                log.error("gRPC call failed: {}", ((StatusRuntimeException) cause).getStatus());
            } else {
                log.error("An error occurred during async execution: {}", cause.getMessage());
            }
            return ResponseEntity.internalServerError().build();
        } catch (Exception e) {
            log.error("An error occurred: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
