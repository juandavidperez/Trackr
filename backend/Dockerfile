# ── Stage 1 : build ─────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Dépendances d'abord : cette couche reste en cache tant que pom.xml ne change pas.
COPY pom.xml .
RUN mvn -B -ntp dependency:go-offline

# Les tests ne sont pas relancés ici : la CI les a déjà exécutés.
COPY src ./src
RUN mvn -B -ntp package -DskipTests \
    && mv target/*.jar app.jar

# ── Stage 2 : runtime (JRE seulement, pas de JDK ni de Maven) ───────────────
FROM eclipse-temurin:17-jre-alpine

# Utilisateur dédié avec un UID numérique fixe : Kubernetes peut alors
# vérifier runAsNonRoot sans connaître les noms d'utilisateurs de l'image.
RUN addgroup -S -g 10001 trackr && adduser -S -u 10001 -G trackr trackr
WORKDIR /app
COPY --from=build --chown=10001:10001 /app/app.jar app.jar
USER 10001

# La JVM adapte la taille du heap à la limite mémoire du conteneur.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
