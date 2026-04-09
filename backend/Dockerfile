FROM node:20-alpine AS build

RUN apk add --no-cache maven openjdk17

WORKDIR /workspace

COPY pom.xml ./
COPY src ./src
RUN mvn -B clean package -DskipTests

FROM build AS runtime

WORKDIR /app

COPY --from=build /workspace/target/*.jar /app/app.jar

RUN rm -rf /workspace/src /root/.m2

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
