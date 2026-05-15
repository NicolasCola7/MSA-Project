package com.acmemobility.fm.gateway.fm_gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MonitoringResponse {
    private String status;
    private String vehicleId;
}
