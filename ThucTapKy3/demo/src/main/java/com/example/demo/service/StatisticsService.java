package com.example.demo.service;

import com.example.demo.dto.statistics.RevenueGranularity;
import com.example.demo.dto.statistics.RevenuePeriodResponse;
import com.example.demo.dto.statistics.TopProductResponse;
import com.example.demo.repository.OrderDetailRepository;
import com.example.demo.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class StatisticsService {

    /** UC-13 has no data -> "no data" is a valid, non-error result, so no default window is enforced beyond "all time". */
    private static final LocalDate EARLIEST_POSSIBLE_DATE = LocalDate.of(1970, 1, 1);

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;

    public StatisticsService(OrderRepository orderRepository, OrderDetailRepository orderDetailRepository) {
        this.orderRepository = orderRepository;
        this.orderDetailRepository = orderDetailRepository;
    }

    @Transactional(readOnly = true)
    public List<RevenuePeriodResponse> revenue(RevenueGranularity granularity, LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = (from != null ? from : EARLIEST_POSSIBLE_DATE).atStartOfDay();
        LocalDateTime toDateTime = (to != null ? to : LocalDate.now()).atTime(LocalTime.MAX);

        return orderRepository.findRevenueByPeriod(granularity.mysqlDateFormatPattern(), fromDateTime, toDateTime).stream()
                .map(row -> new RevenuePeriodResponse((String) row[0], toBigDecimal(row[1])))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> topProducts(LocalDate from, LocalDate to, int limit) {
        LocalDateTime fromDateTime = (from != null ? from : EARLIEST_POSSIBLE_DATE).atStartOfDay();
        LocalDateTime toDateTime = (to != null ? to : LocalDate.now()).atTime(LocalTime.MAX);

        return orderDetailRepository.findTopProducts(fromDateTime, toDateTime, limit).stream()
                .map(row -> new TopProductResponse(
                        ((Number) row[0]).longValue(),
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        toBigDecimal(row[3])
                ))
                .toList();
    }

    private static BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        return new BigDecimal(value.toString());
    }
}
