FROM eclipse-temurin:17-jdk
ENV TZ=Asia/Seoul
WORKDIR /app
COPY build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]