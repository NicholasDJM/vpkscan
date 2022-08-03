rmdir /q /s dist
start "title" /b /wait cmd /c "neu build -r"
copy ".\dist\vpkscan\resources.neu" ".\dist"
rmdir /q /s ".\dist\vpkscan"