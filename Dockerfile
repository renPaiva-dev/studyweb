# Build stage — compila o jar com o Maven Wrapper (baixa o Maven na hora via
# ./mvnw, mesmo mecanismo do ambiente local; nao precisa de imagem com Maven
# pre-instalado).
FROM eclipse-temurin:17-jdk AS build
WORKDIR /app

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src/ src/
RUN ./mvnw -B -q -DskipTests clean package

# Runtime stage — imagem final so com o JRE e o jar, sem toolchain de build.
# Usa a variante glibc (nao alpine): o Apache PDFBox (extracao de texto de
# PDF, UC03) depende de fontconfig em alguns caminhos internos, o que evita
# um problema conhecido de Alpine+PDFBox por poucos MB a mais de imagem.
FROM eclipse-temurin:17-jre AS runtime
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app

COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p /app/uploads && chown -R app:app /app

USER app
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
