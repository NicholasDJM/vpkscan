@echo off
set filetime=%time%
set filetime=%filetime::=%
findstr "enableInspector" "neutralino.config.json" > %tmp%\%filetime%.txt
set /p string=<%tmp%\%filetime%.txt
set string=%string:~-5,4%
if "%string%" == "true" choice /N /M "Inspector is still enabled! Continue? (Y/N)"
if %errorlevel% EQU 2 exit /b
rmdir /q /s dist
start "title" /b /wait cmd /c "neu build"
copy ".\dist\vpkscan\resources.neu" ".\dist"
rmdir /q /s ".\dist\vpkscan"