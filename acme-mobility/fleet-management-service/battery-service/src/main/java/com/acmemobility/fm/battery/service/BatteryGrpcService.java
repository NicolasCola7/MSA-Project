package com.acmemobility.fm.battery.service;

import com.acmemobility.fm.battery.BatteryAck;
import com.acmemobility.fm.battery.BatteryRequest;
import com.acmemobility.fm.battery.BatteryServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@GrpcService
public class BatteryGrpcService extends BatteryServiceGrpc.BatteryServiceImplBase {

    @Override
    public void startMonitoring(BatteryRequest request, StreamObserver<BatteryAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("[startMonitoring] Received gRPC request to start battery monitoring for vehicleId: {}", vehicleId);

        try {
            BatteryAck response = BatteryAck.newBuilder()
                    .setSuccess(true)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
            log.info("[startMonitoring] SUCCESS: Battery monitoring started for vehicleId: {}", vehicleId);
        } catch (Exception e) {
            log.error("[startMonitoring] ERROR: Failed to start battery monitoring for vehicleId: {}", vehicleId, e);
            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("Failed to start battery monitoring: " + e.getMessage())
                            .asRuntimeException()
            );
        }
    }

    @Override
    public void stopMonitoring(BatteryRequest request, StreamObserver<BatteryAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("[stopMonitoring] Received gRPC request to stop battery monitoring for vehicleId: {}", vehicleId);

        try {
            BatteryAck response = BatteryAck.newBuilder()
                    .setSuccess(true)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
            log.info("[stopMonitoring] SUCCESS: Battery monitoring stopped for vehicleId: {}", vehicleId);
        } catch (Exception e) {
            log.error("[stopMonitoring] ERROR: Failed to stop battery monitoring for vehicleId: {}", vehicleId, e);
            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("Failed to stop battery monitoring: " + e.getMessage())
                            .asRuntimeException()
            );
        }
    }
}
