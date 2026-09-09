# ---------- 阶段 1：构建 Vue 前端 ----------
FROM node:20-alpine AS web-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY web/ .
RUN npm run build

# ---------- 阶段 2：编译 Spring Boot 后端 ----------
FROM maven:3.9-eclipse-temurin-17 AS server-build
WORKDIR /app/server
COPY server/pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY server/src ./src
RUN mvn -B -q -DskipTests package

# ---------- 阶段 3：运行（含前端静态资源） ----------
FROM eclipse-temurin:17-jre-alpine
RUN addgroup -S hidechat && adduser -S hidechat -G hidechat     && mkdir -p /data/uploads /data/avatars     && chown -R hidechat:hidechat /data
WORKDIR /app
COPY --from=server-build /app/server/target/hidechat-server.jar app.jar
COPY --from=web-build /app/web/dist/ /app/static/
ENV STATIC_DIR=/app/static
USER hidechat
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=5s --retries=15 CMD java -version
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
