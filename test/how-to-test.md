First install/update the dependencies

	npm install

Make sure mocha is installed globally

	npm install -g mocha

Ensure that both the modepress and users servers are running

Then run the tests. Make sure you pass in as arguments the users "--uconfig" file location. You also need to specify the apiUrl the --apiUrl argument. The apiUrl is the URL endpoint for the modepress plugin created in ./server

	mocha tests.js -R spec --uconfig="../users/dist/config.json" --apiUrl="http://animate.webinate-test.net"