package com.example.demo.repository;

import com.example.demo.entity.Order;
import com.example.demo.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    List<Order> findAllByOrderByCreatedAtDesc();

    /** pattern is a MySQL DATE_FORMAT pattern (%Y-%m-%d / %Y-%m / %Y) chosen by granularity in StatisticsService. */
    @Query(value = """
            SELECT DATE_FORMAT(o.created_at, :pattern) AS period, SUM(o.total_amount) AS revenue
            FROM orders o
            WHERE o.status = 'COMPLETED' AND o.created_at BETWEEN :from AND :to
            GROUP BY period
            ORDER BY period
            """, nativeQuery = true)
    List<Object[]> findRevenueByPeriod(@Param("pattern") String pattern, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
