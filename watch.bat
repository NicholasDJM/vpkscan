@echo off
start "Pug CLI" cmd /c pug -P -w ./src/main.pug ./src/licenses.pug -o ./resources^&pause
start "WindiCSS CLI" cmd /c windicss ./resources/main.html ./resources/licenses.html -a --dev --output ./resources/windi.css^&pause