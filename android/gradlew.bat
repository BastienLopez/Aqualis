@ECHO OFF
SETLOCAL

SET APP_HOME=%~dp0
SET WRAPPER_JAR=%APP_HOME%gradle\wrapper\gradle-wrapper.jar
SET WRAPPER_SHARED=%APP_HOME%gradle\wrapper\gradle-wrapper-shared.jar

IF NOT EXIST "%WRAPPER_JAR%" (
  ECHO Gradle wrapper jar missing. Please download Gradle distribution.
  EXIT /B 1
)

IF NOT EXIST "%WRAPPER_SHARED%" (
  ECHO Gradle wrapper shared jar missing. Please download Gradle distribution.
  EXIT /B 1
)

IF "%JAVA_HOME%"=="" (
  SET JAVA_CMD=java
) ELSE (
  SET JAVA_CMD=%JAVA_HOME%\bin\java
)

"%JAVA_CMD%" -classpath "%WRAPPER_JAR%;%WRAPPER_SHARED%" org.gradle.wrapper.GradleWrapperMain %*
ENDLOCAL
