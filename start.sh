while [ 1 ];
do
	timeout -sHUP 90s node app.js
done
