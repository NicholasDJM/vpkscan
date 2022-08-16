@echo off
set filetime=%time%
set filetime=%filetime::=%
set config=neutralino.config.json
findstr "enableInspector" "%config%" > "%tmp%\%filetime%.txt"
set /p string=<"%tmp%\%filetime%.txt"
set string=%string:~-5,4%
if "%string%" == "true" choice /N /M "Inspector is still enabled! Continue build process? (Y/N)"
if %errorlevel% EQU 2 exit /b
set one=%1
rmdir /q /s dist
if [%one%]==[/r] (
	call :release
) else (
	call :dev
)
exit /b
:release
	start "title" /b /wait cmd /c "neu build -r"
	findstr "version" "%config%" > "%tmp%\%filetime%.txt"
	set /p string=<"%tmp%\%filetime%.txt"
	if not "%string%"=="" set version=%string%
	set version=%version:~-7,5%
	rename ".\dist\vpkscan-release.zip" "vpkscan-release.%version%.zip"
	goto:eof
:dev
	start "title" /b /wait cmd /c "neu build"
	copy ".\dist\vpkscan\resources.neu" ".\dist"
	rmdir /q /s ".\dist\vpkscan"
	goto:eof