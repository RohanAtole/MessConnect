@echo off
setlocal

set "BASE_DIR=%~dp0"
set "WRAPPER_DIR=%BASE_DIR%.mvn\wrapper"
set "DIST_DIR=%WRAPPER_DIR%\dists"
set "MAVEN_VERSION=3.9.9"
set "MAVEN_HOME=%DIST_DIR%\apache-maven-%MAVEN_VERSION%"
set "MAVEN_ZIP=%DIST_DIR%\apache-maven-%MAVEN_VERSION%-bin.zip"
set "MAVEN_URL=https://repo.maven.apache.org/maven2/org/apache/maven/apache-maven/%MAVEN_VERSION%/apache-maven-%MAVEN_VERSION%-bin.zip"
set "MAVEN_REPO=%BASE_DIR%.m2\repository"

if not exist "%DIST_DIR%" mkdir "%DIST_DIR%"
if not exist "%MAVEN_REPO%" mkdir "%MAVEN_REPO%"

if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    echo Downloading Apache Maven %MAVEN_VERSION%...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_ZIP%' -UseBasicParsing } catch { Write-Error $_; exit 1 }"
    if errorlevel 1 exit /b 1

    echo Extracting Maven...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Expand-Archive -LiteralPath '%MAVEN_ZIP%' -DestinationPath '%DIST_DIR%' -Force } catch { Write-Error $_; exit 1 }"
    if errorlevel 1 exit /b 1
)

call "%MAVEN_HOME%\bin\mvn.cmd" "-Dmaven.repo.local=%MAVEN_REPO%" %*
endlocal
