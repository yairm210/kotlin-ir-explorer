# Stage 1: Build the frontend
FROM --platform=$BUILDPLATFORM node:20-alpine AS frontend-build
WORKDIR /app

# Copy package.json and package-lock.json
COPY server/src/main/resources/static/package*.json ./

# Install dependencies and build the frontend
RUN npm install
COPY server/src/main/resources/static/ ./
RUN npm run build

# Stage 2: Build the backend.
# Pinned to use the build platform because ./gradlew is a chonky action,
#  and using emulation to emulate other platforms is sloooow
FROM --platform=$BUILDPLATFORM openjdk:17-slim AS backend-build
WORKDIR /app

# Copy Gradle wrapper and project files
COPY . .

# Copy the built frontend into the backend resources - since the final .jar contains the packages site, as well!
COPY --from=frontend-build /app/dist/ server/src/main/resources/static/dist/

# Build the backend
RUN ./gradlew build --no-daemon

# Stage 3: Runtime
FROM openjdk:17-slim AS runtime
LABEL org.opencontainers.image.authors="Yair Morgenstern"
LABEL org.opencontainers.image.source="https://github.com/yairm210/kotlin-ir-explorer"

WORKDIR /app

# Copy the built JAR from the backend build stage
COPY --from=backend-build /app/server/build/libs/server-all.jar server-all.jar

# Expose the application port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "server-all.jar"]