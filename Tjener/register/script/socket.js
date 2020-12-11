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

//When the register button is clicked
submitBtn.onclick = function() {
    console.log("Register button clicked.");
    console.log(keyInp.value);
    console.log(nameInp.value);
    console.log(passwordInp.value);
    registerUser(keyInp.value, nameInp.value, passwordInp.value)
};

//Register function, it requests registration on the server and wait for a response
function registerUser(key, username, password) {
    console.log(key);
    console.log(username);
    console.log(password);
    socket.emit('regUser', key, username, password); //Call the socket function with the right arguments

    socket.once('regSuccess',function(username) { //If the registration is successfull
        console.log('Brukeren din ble registrert!');
        title.innerHTML = `Brukeren din ${username} ble registrert!`;
    });

    socket.once('regDenied',function() { //If the registration failed
        title.innerHTML = `Brukeren din ${username} ble ikke registrert.`;
        console.log('Registrering feilet');
    });
}