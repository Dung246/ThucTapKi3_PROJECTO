package com.example.demo.dto.statistics;

public enum RevenueGranularity {
    DAY("%Y-%m-%d"),
    MONTH("%Y-%m"),
    YEAR("%Y");

    private final String mysqlDateFormatPattern;

    RevenueGranularity(String mysqlDateFormatPattern) {
        this.mysqlDateFormatPattern = mysqlDateFormatPattern;
    }

    public String mysqlDateFormatPattern() {
        return mysqlDateFormatPattern;
    }
}
