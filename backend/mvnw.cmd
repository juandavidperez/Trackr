@REM Maven Wrapper batch script
@REM https://maven.apache.org/wrapper/
@echo off

set MAVEN_PROJECTBASEDIR=%~dp0
set WRAPPER_PROPERTIES=%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.properties

for /f "tokens=2 delims==" %%a in ('findstr "distributionUrl" "%WRAPPER_PROPERTIES%"') do set MAVEN_URL=%%a

set MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists
set MAVEN_DIR=%MAVEN_HOME%\apache-maven-3.9.6

if not exist "%MAVEN_DIR%" (
    echo Downloading Maven...
    mkdir "%MAVEN_DIR%"
    powershell -Command "Invoke-WebRequest -Uri '%MAVEN_URL%' -OutFile '%MAVEN_DIR%\maven.zip'"
    powershell -Command "Expand-Archive -Path '%MAVEN_DIR%\maven.zip' -DestinationPath '%MAVEN_HOME%'"
    del "%MAVEN_DIR%\maven.zip"
)

"%MAVEN_DIR%\bin\mvn.cmd" %*
