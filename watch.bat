@echo off
start "Pug CLI" cmd /c pug -P -w ./src/main.pug ./src/licenses.pug -o ./resources/html^&pause
start "WindiCSS CLI" cmd /c windicss ./resources/html/main.html ./resources/html/licenses.html -a --dev --output ./resources/windi.css^&pause