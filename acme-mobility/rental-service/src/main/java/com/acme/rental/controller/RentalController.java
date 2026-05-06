package com.acme.rental.controller;

import com.acme.rental.dto.rental.BookVehicleRequest;
import com.acme.rental.dto.rental.BookVehicleResponse;
import com.acme.rental.dto.rental.InitRentalRequest;
import com.acme.rental.dto.rental.InitRentalResponse;
import com.acme.rental.dto.rental.MapVehiclesResponse;
import com.acme.rental.dto.rental.ScanQrRequest;
import com.acme.rental.dto.rental.ScanQrResponse;
import com.acme.rental.service.RentalService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/rentals")
@CrossOrigin(origins = "*")
public class RentalController {

    private final RentalService rentalService;

    public RentalController(RentalService rentalService) {
        this.rentalService = rentalService;
    }

    @GetMapping("/map")
    public ResponseEntity<MapVehiclesResponse> getMapVehicles() {
        return ResponseEntity.ok(rentalService.getMapVehicles());
    }

    @PostMapping("/init")
    public ResponseEntity<InitRentalResponse> initializeRentalProcess(@RequestBody InitRentalRequest request) {
        InitRentalResponse response = rentalService.initializeRentalProcess(request);
        HttpStatus status = response.success() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/scan")
    public ResponseEntity<ScanQrResponse> scanQr(@RequestBody ScanQrRequest request) {
        ScanQrResponse response = rentalService.scanQr(request);
        HttpStatus status = response.success() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }

    @PostMapping("/book")
    public ResponseEntity<BookVehicleResponse> bookVehicle(@RequestBody BookVehicleRequest request) {
        BookVehicleResponse response = rentalService.bookVehicle(request);
        HttpStatus status = response.success() ? HttpStatus.OK : HttpStatus.BAD_REQUEST;
        return ResponseEntity.status(status).body(response);
    }
}
