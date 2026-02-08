@echo off
title Rental Management System Launcher
echo Starting the Rental Management System...
echo ----------------------------------------
cd /d "%~dp0RentalSystem.Web"
echo Building and Running...
dotnet run
pause
