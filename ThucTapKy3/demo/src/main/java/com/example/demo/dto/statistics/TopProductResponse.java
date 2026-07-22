package com.example.demo.dto.statistics;

import java.math.BigDecimal;

public record TopProductResponse(Long productId, String productName, long quantitySold, BigDecimal revenue) {
}
