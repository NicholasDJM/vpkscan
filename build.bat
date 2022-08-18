@echo off
set timeout = 2
REM Timeout must be 2 or more. If the css file is not given enough time to generate, increase the above value.
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
	start "Pug CLI" /b /wait cmd /c pug ./src/main.pug ./src/licenses.pug -b resources -o ./resources/html
	del /Q ".\resources\windi.css"
	REM We're using conncurrently to kill windicss. We require dev mode to correctly generate css classes, but it doesn't exit automatically.
	start "WindiCSS CLI" /b /wait cmd /c "npx concurrently --kill-others "windicss ./resources/html/main.html ./resources/html/licenses.html -a -m --dev --output ./resources/windi.css" "ping localhost -n 2""
	start "ESLint" /b /wait cmd /c "pnpm run eslint"
	start "Stylelint First Pass" /b /wait cmd /c "pnpm run stylelint"
	start "Stylelint Second Pass" /b /wait cmd /c "pnpm run stylelint"
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