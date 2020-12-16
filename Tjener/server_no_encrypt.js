var fs = require('fs');
var http = require('http');
var express = require('express');
var app = express(); //These 4 first variables can be viewed as importing 3 libraries we need for the server and then declaring the objects we need to use them (just like Arduino)

var admin = require("firebase-admin"); //We get the firebase admin library

var serverPort = 2520; //We set the port the server will run on. This can be anything you want, as long as it does not interfere with other software

var server = http.createServer(app); //We declare and create a http server (this because the WebSocket protocol formally is a "upgraded" version of the HTTP protocol)
var io = require('socket.io').listen(server); //Then we start the WebSocket protocol on top of the HTTP server

//HTTP Server
server.listen(serverPort, function(){ //Here we tell the server to start listening (open) on the port we earlier defined
    console.log('listening on *:' + serverPort);
});

//We configure the firebase admin to connect to our database with admin credentials
var serviceAccount = require("/home/gruppe4/a3gruppe4/Tjener/dataprosjektgruppe4-firebase-adminsdk-lkcl8-b17e339054.json"); //This is our admin "password" file (it is a file and it is located in a folder)
var fAdmin = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://dataprosjektgruppe4-default-rtdb.firebaseio.com" //This is the link to our database, this and the password file has to be specified by you
});

//We use the firebase admin credentials to fetch the database object that lets us interact with our database specifically
var db = fAdmin.database();

//A function to generate the current date in a organized format as a string. We want to date our events.
function getDateAsString() {
    var currentDate = new Date(); //We use the JavaScript Date object/function and then configure it
    var currentMonth;
    var currentDay;

    if(currentDate.getMonth() < 10) {
        currentMonth = "0" + String(currentDate.getMonth());
    } else {
        currentMonth = String(currentDate.getMonth());
    }

    if(currentDate.getDay() < 10) {
        currentDay = "0" + String(currentDate.getDay());
    } else {
        currentDay = String(currentDate.getDay());
    }

    var date = currentDate.getFullYear() + "-" + currentMonth + "-" + currentDay;
    return date; //returns the date string
}

//A function to generate the current time in a organized format as a string. We want to timestamp our events
function getTimeAsString() {
    var currentTime = new Date(); //We use the JavaScript Date object/function and then configure it

    var currentHour;
    var currentMinute;
    var currentSecond;

    if(currentTime.getHours() < 10) {
        currentHour = "0" + String(currentTime.getHour());
    } else {
        currentHour = String(currentTime.getHours());
    }

    if(currentTime.getMinutes() < 10) {
        currentMinute = "0" + String(currentTime.getMinutes());
    } else {
        currentMinute = String(currentTime.getMinutes());
    }

    if(currentTime.getSeconds() < 10) {
        currentSecond = "0" + String(currentTime.getSeconds());
    } else {
        currentSecond = String(currentTime.getSeconds());
    }

    var time = currentHour + "-" + currentMinute + "-" + currentSecond;
    return time; //returns the time string
}

//This is our registration key. If the user does not enter, they will not be allowed to register
var regKey = "passord"; //This can be set to whatever you want, and it should probably be more secure than "password"

io.on('connection', function(socket) { //This is the server part of the "what happens when we first connect" function. Everytime a user connects a instance of this is set up for the user privatley
    console.log('a user connected'); //The server print this message

    //This UID will be used for firebase userID. This is a ID that identifies your used in the Firebase database (and can be used for socket purposes too)
    var regUID = 0;

    //Client ID needs to be fetched
    var clientID = socket.id; //This is the actual clientID in alphanumeric characters (a string variable)
    var client = io.sockets.connected[clientID]; //This is the client object, each client has its own object (again like in Arduino declaring a object)
    //client.emit("clientConnected", clientID); THIS SHOULDNT BE HERE I THINK
    console.log("User ID: " + clientID);

    //Client IP
    var clientIPRAW = client.request.connection.remoteAddress; //Fetch the IP-address of the client that just connected

    var IPArr = clientIPRAW.split(":",4); //Split it, which is to say reformat the fetched data
    console.log("User IP: " + IPArr[3]); //Print out the formated IP-address (stored in IPArr[3])

    io.emit("clientConnected", clientID, IPArr[3]); //Now we can use our custom defined "on connection" function to tell the client its ID and IP-address

    //Disconnect handeling
    client.on('disconnect', function(){ //This function is called for a client when the client is disconnected. The server can then do something even tough the client is disconnected
        console.log("user " + clientID + " disconnected, stopping timers if any");

        for (var i = 0; i < timers.length; i++) {//clear timer if user disconnects
            clearTimeout(timers[i]); //Cleartimer is the same as stopping the timer, in this case we clear all possible timers previously set
        }

        //When the user disconnects we want to log and store this in the database
        if(regUID != undefined && regUID != "" && regUID != 0) { //This checks that the user is logged in via the regUID

            stopListeningForData(); //Stop client data stream, new database entries will not be sent to the socket client

            var currentDate = getDateAsString(); //Get the date
            var currentTime = getTimeAsString(); //Get the time
            var currentDateTime = currentDate + "-" + currentTime; //Put the date and time together

            db.ref('users/' + regUID).update({ //Here we make a call to our database to update our user in the users directory of the database
                is_active: 0, //We set the sures to not-active
                last_active: currentDateTime, //We timestamp the last time the user was logged on (which is to say when they logged of)
                ip_address: IPArr[3] //We log the last known IP-address of the user, in case this could be usefull
            }).then((snap) => { //The .then function is called after a sucessfull call/request to the databas
                console.log("User " + regUID + " updated last_active to " + currentDateTime + " and ip_address to " + IPArr[3]);
                console.log("User " + regUID + " is no longer ative"); //We console log some properties about the user
            });
        }
    }); //end disconnect

    //Register a user with the register page and functions
    socket.on('regUser', function(key, username, password) { //One needs to call regUser with a key, username and password

        if(key == regKey) { //This checks the regkey to see if the user has the right key (that they are allowed to register a user)
            console.log("-------User Registration-------"); //Log this function clearly
            console.log("Username:" + username);
            console.log("Password:" + password);

            var regDate = getDateAsString(); //Get the register date
            var currentTime = getTimeAsString(); //Get the register time
            console.log(regDate);
            console.log(currentTime);

            db.ref('users/').push( { //Create a new user in the user database
                username: username,
                password: password,
                register_date: regDate,
                is_active: 0,
                last_active: regDate + "-" + currentTime,
                ip_address: IPArr[3]
            }).then((snap) => { //After the user is successfully registered do something
                console.log("Data was sent to server and user " + username + " was registered");
                client.emit("regSuccess", username); //We tell the client that the user was successfully registered
                console.log("------------- End User Reg. -------------");
            });

        } else {
            console.log("Registerkey does not match, you are not allowed to register a user");
            client.emit("regDenied"); //If the user does not enter the correct key to register tell them
        }
    });

    //Authenticate a user on the controlpanel/client
    socket.on('authUser', function (username, password) { //One needs to call authUser with a username and password
        var data = db.ref('users').orderByChild('username').equalTo(username); //This is a firebase db query
        //We want to search the "users" database, and in that database we want to target on of the subfields called username
        //Then with that target we go trough all the user entries and look for the user with a username equal to our entered username
        //When that user/object is found we send it from the database to Node.js to do something with the data (which happens below)

        data.once('value', function(snap) { //We call this function one time, when the data is fetched from the database. The data is inside the snap variable

        }).then((snap) => { //When the data is successfully fetched (finished downloading properly) we do something with ti

            if(snap.numChildren() == 1) { //We check to see that there is only one user with the username
                //We have no registration check to see if there already exists a user with a given username
                console.log("User exists");
                var value = snap.val(); //This is where we get the JSON-array of all returned data entries from the database (even tough it is only 1 object returned)
                console.log(value);

                var UID = Object.keys(value)[0]; //Here we use a function that retrieves all the data keys (the ID of the data entry)

                var output = value[UID]; //Then we use the ID to retrieve the data from the JSON-array
                console.log(output);

                if(output.password == password) { //Then, if the password matches we proceed. The password can not be checked before we have fetched the data
                    console.log("Username and password matches, user is authenticated");
                    regUID = UID; //Does it match we set the client-global variable regUID to the UID of the data entry. We call this ID the UserID (UID)
                    console.log(regUID);
                    client.emit("authSuccess", username); //Now we tell the client that it has successfully authenticated with the server

                    startListeningForData(); //Start client data stream, everytime the database gets a new entry the socket client will be sent the data

                    if(regUID != undefined && regUID != "" && regUID != 0) { //We use the same check as in disconnected to see if the user is registered on the Node/Socket server
                        var currentDate = getDateAsString(); //Get date
                        var currentTime = getTimeAsString(); //Get time
                        var currentDateTime = currentDate + "-" + currentTime; //Fusion them together

                        db.ref('users/' + regUID).update({ //Tell the database that the user has logged in and is now active
                            is_active: 1, //The user is active
                            last_active: currentDateTime, //Save the last_active time of a user to now
                            ip_address: IPArr[3] //Save the IP-address of the user
                        }).then((snap) => { //When the user update has been saved
                            console.log("User " + regUID + " updated last_active to " + currentDateTime + " and ip_address to " + IPArr[3]);
                        });
                    }

                } else {
                    console.log("Userpassword does not match.");
                    client.emit("authFail"); //Tell the client that the authentication has failed
                }

            } else {
                console.log("Error finding users, either there are to many or none.");
                client.emit("authFail"); //Tell the client that the authentication has failed
            }

        })

    });

    //Change states (general user defined functions)
    socket.on('changeLEDState', function(state) { //This server function constantly checks if a client (webpage) calls its
        //If the webpage calles it it will us the "io.emit" (to send to alle clients) and not "client.emit" to only send to one client
        //In this way, when we send it to call clients, the ESP32 will get the message. It is an easy solution which can be made better

        if(regUID != undefined && regUID != "" && regUID != 0) { //Check if the user is authenticated
            io.emit('LEDStateChange', state); //This is the actual socket.io emit function
            console.log('user ' + clientID + ' changed the LED state to: ' + state);
        } else {
            console.log("User is not authenticated");
        }

    });

     //Change heatingstate
    socket.on('changeHeatState', function(state)){
        io.emit('HeatStateChange', state);
        console.log('user' + clientID + 'changed the state of the heater to: ' + state)
    }

        socket.on('IsLedOkay',function(data)){ //Checks if last command to ESP was executed
        if (data==0){
            console.log('user ' + clientID + ' confirmed your last action on LED')
        }
        if (data !== 0){
            console.log('user ' + clientID + ' did not execute last command on LED')
        }
    }

    socket.on('IsHeatOkay',function(data)){ //Checks if last command to ESP was executed
        if (data==0){
            console.log('user ' + clientID + ' confirmed your last action on the heating')
        }
        if (data !== 0){
            console.log('user ' + clientID + ' did not execute last command on the heating')
        }
    }


    var timers = []; //Stores all our timers
    //Read data from board section

    socket.on('requestDataFromBoard', function(interval, sensorname) { //This function i earlier described client-side on the webpage.
        //When the webpage calls it it will every time-interval send the "dataRequest" function to all connected clients.
        //When a ESP32 receives this command, it will reply with a data of a specific measurement eg. a temperature sensor.
        //This way, the timer is on the server/node.js and not on the ESP32/Arduino

        if(regUID != undefined && regUID != "" && regUID != 0) { //Check if the user is authenticated
            console.log('user ' + clientID + ' requested data with interval (ms): ' + interval);

            if (interval > 99) { //if the timeinterval is not more than 100ms it does not allow it to start
                timers.push( //If an actual argument is given (a time period) it starts the timer and periodically calls the function
                    setInterval(function () { //If an actual argument is given (a time period) it starts the timer and periodically calls the function
                        io.emit('dataRequest', sensorname); //Send "dataRequest" command/function to all ESP32's
                    }, interval)
                );
            } else {
                console.log("Too short timeintervall");
            }

        } else {
            console.log("User is not authenticated");
        }


    });

    socket.on('stopDataFromBoard', function() { //This function stops all the timers set by a user so that data will no longer be sent to the webpage

        if(regUID != undefined && regUID != "" && regUID != 0) { //Check if the user is authenticated
            for (var i = 0; i < timers.length; i++) {//For loop to clear all set timers
                clearTimeout(timers[i]); //Cleartimer is the same as stopping the timer, in this case we clear all possible timers previously set
                console.log('user ' + clientID + ' cleared data request interval');
            }
        } else {
            console.log("User is not authenticated");
        }

    });

    socket.on('dataFromTmp', function(data /*, mcuID */) { //This is function that actually receives the data. The earlier one only starts the function.

        //if(regUID != undefined && regUID != "" && regUID != 0) { //Check if the user is authenticated
        //If you check too se if the user is authenticated here the microcontroller would also need to be authenticated

            //io.emit('data', data); //Everytime a "dataFromBoard" tag (with data) is sent to the server, "data" tag with the actual data is sent to all clients
            //The io will send it to call clients at the same time. Instead we can use Firebase to only send it to those who are listening. Scroll down for code

            //This means the webbrowser will receive the data, and can then graph it or similar.
            console.log('user ' + clientID + ' gained the data: ' + data);

            var regDate = getDateAsString(); //Get the register date
            var currentTime = getTimeAsString(); //Get the register time

            //Everytime the mcu sends the server data it is stored in the database (this is permanent storing, the data is only deleted if you do it yourself)
            db.ref('TMPdata/'/* + regUID*/).push({ //One can store data in a subdirectory for the user in sensordata by removing the comment inside .ref
              /* UID: regUID, If you choose to have data ownership stored per entry the microcontroller would have to be authenticated */
                mcu_id: "esp32_1", //You could add an ekstra variable to every dataFromBoard transmission with a microcontrollerID to lessen the need for authentication
                data: data, //This would be the sensor data, eg a temperature datapoint
                logged_at: regDate + "-" + currentTime, //When is the data taken, both date and time
                ip_address: IPArr[3] //What is the IP-address of the unit that logged the data
            }).then((snap) => { //When the data has been successfully saved
                console.log("Sensordata was saved");
            });

        /*} else {
        }*/

    });

        socket.on('dataFromLDR', function(data /*, mcuID */) { //This is function that actually receives the data. The earlier one only starts the function.

        //if(regUID != undefined && regUID != "" && regUID != 0) { //Check if the user is authenticated
        //If you check too se if the user is authenticated here the microcontroller would also need to be authenticated

            //io.emit('data', data); //Everytime a "dataFromBoard" tag (with data) is sent to the server, "data" tag with the actual data is sent to all clients
            //The io will send it to call clients at the same time. Instead we can use Firebase to only send it to those who are listening. Scroll down for code

            //This means the webbrowser will receive the data, and can then graph it or similar.
            console.log('user ' + clientID + ' gained the data: ' + data);

            var regDate = getDateAsString(); //Get the register date
            var currentTime = getTimeAsString(); //Get the register time

            //Everytime the mcu sends the server data it is stored in the database (this is permanent storing, the data is only deleted if you do it yourself)
            db.ref('LDRdata/'/* + regUID*/).push({ //One can store data in a subdirectory for the user in sensordata by removing the comment inside .ref
              /* UID: regUID, If you choose to have data ownership stored per entry the microcontroller would have to be authenticated */
                mcu_id: "esp32_1", //You could add an ekstra variable to every dataFromBoard transmission with a microcontrollerID to lessen the need for authentication
                data: data, //This would be the sensor data, eg a temperature datapoint
                logged_at: regDate + "-" + currentTime, //When is the data taken, both date and time
                ip_address: IPArr[3] //What is the IP-address of the unit that logged the data
            }).then((snap) => { //When the data has been successfully saved
                console.log("Sensordata was saved");
            });

        /*} else {
        }*/

    });
    //Change states (general user defined functions)
    socket.on('changeLEDState', function(state) { //This server function constantly checks if a client (webpage) calls its
        //If the webpage calles it it will us the "io.emit" (to send to alle clients) and not "client.emit" to only send to one client
        //In this way, when we send it to call clients, the ESP32 will get the message. It is an easy solution which can be made better

        if(regUID != undefined && regUID != "" && regUID != 0) { //Check if the user is authenticated
            io.emit('LEDStateChange', state); //This is the actual socket.io emit function
            console.log('user ' + clientID + ' changed the LED state to: ' + state);
        } else {
            console.log("User is not authenticated");
        }

    });
     //Change heatingstate
    socket.on('changeHeatState', function(state)){
        io.emit('HeatStateChange', state);
        console.log('user' + clientID + 'changed the state of the heater to: ' + state)
    }

    socket.on('IsLedOkay',function(data)){ //Checks if last command to ESP was executed
        if (data==0){
            console.log('user ' + clientID + ' confirmed your last action on LED')
        }
        if (data !== 0){
            console.log('user ' + clientID + ' did not execute last command on LED')
        }
    }

    socket.on('IsHeatOkay',function(data)){ //Checks if last command to ESP was executed
        if (data==0){
            console.log('user ' + clientID + ' confirmed your last action on the heating')
        }
        if (data !== 0){
            console.log('user ' + clientID + ' did not execute last command on the heating')
        }
    }
    //One can also write normal functions inside the io.on connection
    //This function sends new database data to the socket client (normally webpage) automatically
    function sendDataToClient(snap) {
        var value = snap.val(); //Data object from Firebase

        var DataID = Object.keys(value)[0]; //Here we use a function that retrieves all the data keys (the ID of the data entry)
        var data = value[DataID]; //Then we use the ID to retrieve the data from the JSON-array
        console.log("Data: " + data);
        client.emit('data', data); //We emit to the same listener on the webpage as in the earlier io.emit command ('data') in the dataFromBoard function
    }
    //This function starts the stream of data, everytime the dataFromBoard socket function saves data to the database it is detected here
    function startListeningForData() {
        db.ref('sensordata/' /* + regUID*/).limitToLast(1).on('child_added', sendDataToClient); //Sets up a detection for new data
    }
    //Stop the datastream from the database to the socket client (normally webpage)
    function stopListeningForData() {
        db.ref('sensordata/' /* + regUID*/).off('child_added', sendDataToClient); //Stops detection for new data
    }

});
