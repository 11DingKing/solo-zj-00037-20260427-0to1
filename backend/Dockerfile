FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["Whiteboard.Core/Whiteboard.Core.csproj", "Whiteboard.Core/"]
COPY ["Whiteboard.Infrastructure/Whiteboard.Infrastructure.csproj", "Whiteboard.Infrastructure/"]
COPY ["Whiteboard.API/Whiteboard.API.csproj", "Whiteboard.API/"]

RUN dotnet restore "Whiteboard.API/Whiteboard.API.csproj"

COPY . .

WORKDIR "/src/Whiteboard.API"
RUN dotnet build "Whiteboard.API.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Whiteboard.API.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Whiteboard.API.dll"]