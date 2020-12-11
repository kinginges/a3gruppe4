var socket = io.connect('192.168.137.181:2520', {secure: false}); //This line declares a socket.io object to var "socket" and connects to the server (change the IP-address and port to your own)
//The "secure: false" tells if the connection will be encrypted or not. Since we will not encrypt our connections, this is false.

//Socket.io has several functions. The .on function refers to what will happen when the client receive a call called 'connect' from the server
//View it as calling a function remotley. The server tells the client it wants to call this function with no arguments.
socket.on('connect',function() { //When you connect to the server (and it works) call this function
    console.log('Client has connected to the server!'); //The client prints this message
}); //The 'connect' function/identifier is the standard procedure. To make something more we have to make it ourselves

socket.on('clientConnected',function(id, ip) { //This is our selfmade functions. Here we can have the server return arguments (data) that we need
    console.log('Client recevied ID: ' + id); //In this case the server will tell us what our local ID is (auto assigned)
    console.log("Client IP: " + ip);//And it will tell us what our IP-address

});

socket.on('data', function(data) { //Received data from the server who is forwarding it to us from the ESP32

    console.log('Data was received: ' + data);
    console.log(Number(data));

    if (dataArr1.length > 10) {

        dataArr1.shift(); //This removes the first element of the array
        dataArr1.push(data) //This pushes data to the array that stores all the chart data

    } else {
        dataArr1.push(data); //This pushes data to the array that stores all the chart data
    }

    myLineChart.update(); //This updates the chart with the dataArr1 data just added

});

var username = prompt("Skriv inn brukernavnet ditt ", "1"); //This asks you for a username when the webpage first loads
var passwd = prompt("Skriv in passordet ditt", "1"); //This asks you for a password when the webpage first loads

if(username != undefined && passwd != undefined) {  //If the username and password is actually entered, empty input will not send the auth request
    authUser(username, passwd); //Call the auth function on the client
}

function authUser(username, password) { //The auth function

    socket.emit('authUser', username, password); //We emit the username and password to the server. This then checks the credentials in the local database

    //Response from the server:
    socket.once('authSuccess', function(username) { //If the server tells us "authSuccess", we are authenticated because the username/password matched with the db one
        console.log("User " + username + " was authenticated");
        alert("Du er logget inn"); //We are alerted with a message
    });

    socket.once('authFail', function(username) {  //If the server tells us "authFail", we are not authenticated because the username/password did not match
        console.log("User authentication with username " + username + " failed.");
        alert("Du tastet inn feil brukernavn eller passord."); //We are alerted with a message
        location.reload(); //This reloads the webpage so the user can not do anything if they dont manage to login
    });

}

//In this function (which is essentially built up the same as a void function in Arduino) we want to send something to the server
//For this we use the other important Socket.io function, .emit(arg). Here we are telling our socket object so call the "changeLEDState" function
//on the server with the "state" argument. By calling the function on the server we mean that we send data to the server that tells it to do something
function changeLEDState(state) {
    //This function controls wether a LED-light is on or of
    socket.emit('changeLEDState', state); //Here the actual socket-object function is called. If we want a response we will have to set up a function (.on) like earlier.
    console.log("changeLEDState called");

}

function changeDriveState(state) {

    socket.emit('changeDriveState', state); //Same logic as earlier, this calls the change of motor direction
    console.log("changeDriveState called");

}

function changeTurnState(state) {

    socket.emit('changeTurnState', state);
    console.log("changeTurnState called");

}

function changeStopState(state) {

    socket.emit('changeStopState', state);
    console.log("changeStopState called");

}

//This function also emits something to the server. But in this case we want something a little bit more complex to happen.
//Since Arduino has a limited amount of timers, and using millis can be annoying, we have the possibilties of handing that task over to JavaScript on Node.js
//The function we are calling here will tell the server to set up a JavaScript timer, which then will periodically send a message to the ESP32 asking for data.
//Since the ESP32 easily can react to such a request it sends the data with no problems, and with no timers in use.
//This means we dont have to use the delay() function or the millis() function in Arduino, we can just let Node and JavaScript fix the tracking of time for us
//This is the function that will make the ESP32 transmit data to the server, and not the other way around
function requestDataFromBoard(interval) {
    socket.emit('requestDataFromBoard', interval); //Here we tell the server to call the function "requestDataFromBoard" with a argument called "intervall"
    //The intervall value is the period of time between each data transmit from the ESP32 to the server. Typical values can be everything form 100ms to 100s
    console.log("requestDataFromBoard was called with intervall: " + interval);
} //Be careful to not set the interval value to low, you do not want to overflood your server with data/requests

function stopDataFromBoard() { //Tells the server to stop all timers so that data is no longer sent from the ESP32 to the webpage
    socket.emit('stopDataFromBoard'); //Here we tell the server to call the function "stopDataFromBoard"
    console.log("stopDataFromBoard was called");
}
