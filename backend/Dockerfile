# ── Stage 1: Build ────────────────────────────────────
FROM maven:3.9-amazoncorretto-17-alpine AS build

WORKDIR /app

# Cache dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build the application (skip tests — they run in CI)
COPY src ./src
RUN mvn package -DskipTests -B && \
    mv target/*.jar app.jar

# ── Stage 2: Run ─────────────────────────────────────
FROM amazoncorretto:17-alpine

RUN addgroup -S trackr && adduser -S trackr -G trackr
WORKDIR /app

COPY --from=build /app/app.jar .

USER trackr

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
