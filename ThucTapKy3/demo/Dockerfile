# --- Build stage: full JDK + Gradle wrapper, produces the boot jar ---
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy only the files needed to resolve dependencies first, so this layer
# (the slow one) is cached and skipped on rebuilds that only change src/.
COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --no-daemon dependencies || true

COPY src src
RUN ./gradlew --no-daemon bootJar -x test

# --- Runtime stage: slim JRE only, just the jar ---
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
