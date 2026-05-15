package com.acmemobility.fm.battery.service;

import acmemobility.battery.Battery;
import acmemobility.battery.BatteryServiceGrpc;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@GrpcService
public class BatteryGrpcService extends BatteryServiceGrpc.BatteryServiceImplBase {

    @Override
    public void startMonitoring(Battery.BatteryRequest request, StreamObserver<Battery.BatteryAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("[startMonitoring] Received gRPC request to start battery monitoring for vehicleId: {}", vehicleId);

        Battery.BatteryAck response = Battery.BatteryAck.newBuilder()
                .setSuccess(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
        log.info("[startMonitoring] SUCCESS: Battery monitoring started for vehicleId: {}", vehicleId);
    }

    @Override
    public void stopMonitoring(Battery.BatteryRequest request, StreamObserver<Battery.BatteryAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("[stopMonitoring] Received gRPC request to stop battery monitoring for vehicleId: {}", vehicleId);

        Battery.BatteryAck response = Battery.BatteryAck.newBuilder()
                .setSuccess(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
