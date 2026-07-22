package com.example.demo.repository;

import com.example.demo.entity.OrderDetail;
import com.example.demo.entity.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderDetailRepository extends JpaRepository<OrderDetail, Long> {

    /** UC-08 eligibility check: has this user received (COMPLETED order) this product at least once? */
    boolean existsByProduct_IdAndOrder_User_IdAndOrder_Status(Long productId, Long userId, OrderStatus status);

    @Query(value = """
            SELECT p.id AS productId, p.name AS productName,
                   SUM(od.quantity) AS quantitySold, SUM(od.quantity * od.unit_price) AS revenue
            FROM order_details od
            JOIN orders o ON od.order_id = o.id
            JOIN products p ON od.product_id = p.id
            WHERE o.status = 'COMPLETED' AND o.created_at BETWEEN :from AND :to
            GROUP BY p.id, p.name
            ORDER BY quantitySold DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTopProducts(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("limit") int limit);
}
