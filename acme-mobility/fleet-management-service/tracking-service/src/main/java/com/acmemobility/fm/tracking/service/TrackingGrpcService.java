package com.acmemobility.fm.tracking.service;

import com.acmemobility.fm.tracking.TrackingAck;
import com.acmemobility.fm.tracking.TrackingRequest;
import com.acmemobility.fm.tracking.TrackingServiceGrpc;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@GrpcService
public class TrackingGrpcService extends TrackingServiceGrpc.TrackingServiceImplBase {

    @Override
    public void startTracking(TrackingRequest request, StreamObserver<TrackingAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("[startTracking] Received gRPC request to start tracking for vehicleId: {}", vehicleId);

        try {
            // Here we would initialize the tracking logic (e.g. state in memory or DB)
            
            TrackingAck response = TrackingAck.newBuilder()
                    .setSuccess(true)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
            log.info("[startTracking] SUCCESS: Tracking started for vehicleId: {}", vehicleId);
        } catch (Exception e) {
            log.error("[startTracking] ERROR: Failed to start tracking for vehicleId: {}", vehicleId, e);
            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("Failed to start tracking: " + e.getMessage())
                            .asRuntimeException()
            );
        }
    }

    @Override
    public void stopTracking(TrackingRequest request, StreamObserver<TrackingAck> responseObserver) {
        String vehicleId = request.getVehicleId();
        log.info("[stopTracking] Received gRPC request to stop tracking for vehicleId: {}", vehicleId);

        try {
            TrackingAck response = TrackingAck.newBuilder()
                    .setSuccess(true)
                    .build();

            responseObserver.onNext(response);
            responseObserver.onCompleted();
            log.info("[stopTracking] SUCCESS: Tracking stopped for vehicleId: {}", vehicleId);
        } catch (Exception e) {
            log.error("[stopTracking] ERROR: Failed to stop tracking for vehicleId: {}", vehicleId, e);
            responseObserver.onError(
                    Status.INTERNAL
                            .withDescription("Failed to stop tracking: " + e.getMessage())
                            .asRuntimeException()
            );
        }
    }
}
