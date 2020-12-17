var socket = io.connect('http://84.38.153.29:2520', {secure: false}); //This line declares a socket.io object to var "socket" and connects to the server (change the IP-address and port to your own)
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

socket.on('TMPtoClient', function(data) { //Received data from the server who is forwarding it to us from the ESP32

    console.log('Temperature was received: ' + data);
    console.log(Number(data));

    if (dataArr1.length > 10) {

        dataArr1.shift(); //This removes the first element of the array
        dataArr1.push(data) //This pushes data to the array that stores all the chart data

    } else {
        dataArr1.push(data); //This pushes data to the array that stores all the chart data
    }
    
    myLineChart.update(); //This updates the chart

});

socket.on('LDRtoClient', function(data) { //Received data from the server who is forwarding it to us from the ESP32

    console.log('Light level was received: ' + data);
    console.log(Number(data));

    if (dataArr2.length > 10) {

        dataArr2.shift(); //This removes the first element of the array
        dataArr2.push(data) //This pushes data to the array that stores all the chart data

    } else {
        dataArr2.push(data); //This pushes data to the array that stores all the chart data
    }

    myLineChart.update(); //This updates the chart

});

//In this function (which is essentially built up the same as a void function in Arduino) we want to send something to the server
//For this we use the other important Socket.io function, .emit(arg). Here we are telling our socket object so call the "changeLEDState" function
//on the server with the "state" argument. By calling the function on the server we mean that we send data to the server that tells it to do something
function toggleLED(state) {
    //This function controls wether a LED-light is on or of
    socket.emit('changeLEDState', state); //Here the actual socket-object function is called. If we want a response we will have to set up a function (.on) like earlier.
    console.log("changeLEDState called");

}
function toggleHEAT(state) {
    //This function controls wether a LED-light is on or of
    socket.emit('changeHeatState', state); //Here the actual socket-object function is called. If we want a response we will have to set up a function (.on) like earlier.
    console.log("changeHeatState called");

}
function register() {                                                           // This is the function to register a new user
    console.log("Registrerer ny bruker");
    var formUname = document.getElementById("regUname").value;                  // Fetches the username from the input-field
    var formPasswd = document.getElementById("regPasswd").value;                // Fetches the password from the input-field
    var formPasswdConfirm = document.getElementById("regPasswdConfirm").value;  // Fetches the "confirm password" from the input-field
    var formKey = document.getElementById("regKey").value;                      // Fetches the key from the input-field

    if (formPasswd === formPasswdConfirm) {                                     // Controls that the user confirmed the password correctly
        socket.emit('regUser', formKey, formUname, formPasswd);                 // If the password is confirmed correctly then it sends all the information to the server.
        console.log("Registrerer: " + formUname);                               // Logs the username to the console

        socket.on('regSuccess', function(username) {                            // Listens for success from the server.
            alert("Registrering fullført!");                                    // If the server emits on regSuccess then the registratioin is succeeded and an alert notify the user
            document.getElementById("regUname").value = "";                     // Clears the username-field
            document.getElementById("regPasswd").value = "";                    // Clears the password-field
            document.getElementById("regPasswdConfirm").value = "";             // Clears the "confirm password"-field
            document.getElementById("regKey").value = "";                       // Clears the key-field
        });
        socket.on('regDenied', function() {                                     // Listens for denial from the server
            alert("Feil registreringsnøkkel");                                  // If the server denies then it is assumed that it is because the regkey was wrong and an alert notifies the user
            document.getElementById("regKey").value = "";                       // Clears the key-field
        });
    } else {
        alert("Passordene er ikke like!");                                      // If the password don't match then an alert notifies the user
        document.getElementById("regPasswd").value = "";                        // Clears the password-field
        document.getElementById("regPasswdConfirm").value = "";                 // Clears the "confirm password"-field
    }
}
function login() {                                                              // This is the function to login a user
    var formUname = document.getElementById("loginUname").value;                // Fetches the username from the input-field
    var formPasswd = document.getElementById("loginPasswd").value;              // Fetches the password from the input-field
    console.log(formUname);
    socket.emit('authUser', formUname, formPasswd);                             // Emits the login-information to the server

    socket.on('authSuccess', function(username) {                               // If the authirozation is succesful then this function is called
        alert("Du er nå innlogget");                                            // Send an alert to the user that the login was succesful
        document.getElementById("loginUname").value = "";                       // Clears the username-field
        document.getElementById("loginPasswd").value = "";                      // Clears the password-field
    });
    socket.on('authFail', function() {                                          // If the autherization fails then this function is called
        alert("Feil passord!");                                                 // Assumes that it is becaus of wrong password and notifies the user
        document.getElementById("loginPasswd").value = "";                      // Clears the password-field
    });
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
