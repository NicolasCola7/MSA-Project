package com.acmemobility.fm.tracking.tracking_service.service;

import acmemobility.tracking.Tracking;
import acmemobility.tracking.TrackingServiceGrpc;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@GrpcService
public class TrackingGrpcService extends TrackingServiceGrpc.TrackingServiceImplBase {

    @Override
    public void startTracking(Tracking.TrackingRequest request, StreamObserver<Tracking.TrackingAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("Received gRPC request to start tracking for vehicleId: {}", vehicleId);

        // Here we would initialize the tracking logic (e.g. state in memory or DB)
        
        Tracking.TrackingAck response = Tracking.TrackingAck.newBuilder()
                .setSuccess(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
        log.info("Tracking started successfully for vehicleId: {}", vehicleId);
    }

    @Override
    public void stopTracking(Tracking.TrackingRequest request, StreamObserver<Tracking.TrackingAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("Received gRPC request to stop tracking for vehicleId: {}", vehicleId);

        Tracking.TrackingAck response = Tracking.TrackingAck.newBuilder()
                .setSuccess(true)
                .build();

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
