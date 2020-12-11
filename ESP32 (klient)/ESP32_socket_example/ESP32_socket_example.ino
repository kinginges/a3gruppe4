#include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly

#include <WiFi.h>//Imports the needed WiFi libraries
#include <WiFiMulti.h> //We need a second one for the ESP32 (these are included when you have the ESP32 libraries)

#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets

WiFiMulti WiFiMulti; //Declare an instane of the WiFiMulti library
SocketIoClient webSocket; //Decalre an instance of the Socket.io library

void event(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload);
}

void changeLEDState(const char * LEDStateData, size_t length) { //What happens when the ESP32 receives a instruction from the server (with variable) to change the LED
  Serial.printf("LED State: %s\n", LEDStateData); //First we print the data formated with the "printf" command
  Serial.println(LEDStateData); //Then we just print the LEDStateData which will be a int (0 og 1 so in reeality bool) that tells us what to do with the LED

  //Data conversion //We need som data processing to make this work
  String dataString(LEDStateData); //First we convert the const char array(*) to a string in Arduino (this makes thing easier)
  int LEDState = dataString.toInt(); //When we have a string we can use the built in Arduino function to convert to an integer

  Serial.print("This is the LED state in INT: "); //We print the final state
  Serial.println(LEDState);
  digitalWrite(18, LEDState);//We now use the varible to change the light (1 is on, 0 is off)
}

void changeDriveState(const char * DriveStateData, size_t length) { //Same logic as earlier
  Serial.printf("Drive State: %s\n", DriveStateData);
  Serial.println(DriveStateData);

  //Data conversion
  String dataString(DriveStateData);
  int DriveState = dataString.toInt();

  Serial.print("This is the Drive state in INT: ");
  Serial.println(DriveState);
  Drive(DriveState);
}

void changeTurnState(const char * TurnStateData, size_t length) {
  Serial.printf("Turn State: %s\n", TurnStateData);
  Serial.println(TurnStateData);

  //Data conversion
  String dataString(TurnStateData);
  int TurnState = dataString.toInt();

  Serial.print("This is the Turn state in INT: ");
  Serial.println(TurnState);
  softTurn(TurnState);
}

void stopDriving(const char * StopStateData, size_t length) {
  Serial.printf("Stop State: %s\n", StopStateData);
  Serial.println(StopStateData);

  //Data conversion
  String dataString(StopStateData);
  int StopState = dataString.toInt();

  Serial.print("This is the Stop state in INT: ");
  Serial.println(StopState);
  Stop(StopState);
}

void dataRequest(const char * DataRequestData, size_t length) {//This is the function that is called everytime the server asks for data from the ESP32
  Serial.printf("Datarequest Data: %s\n", DataRequestData);
  Serial.println(DataRequestData);

  //Data conversion
  String dataString(DataRequestData);
  int RequestState = dataString.toInt();

  Serial.print("This is the Datarequest Data in INT: ");
  Serial.println(RequestState);

  if(RequestState == 0) { //If the datarequest gives the variable 0, do this (default)
    
    char str[10]; //Decalre a char array (needs to be char array to send to server)
    itoa(analogRead(22), str, 10); //Use a special formatting function to get the char array as we want to, here we put the analogRead value from port 27 into the str variable
    Serial.print("ITOA TEST: ");
    Serial.println(str);
    
    webSocket.emit("dataFromBoard", "250"); //Here the data is sendt to the server and then the server sends it to the webpage
    //Str indicates the data that is sendt every timeintervall, you can change this to "250" and se 250 be graphed on the webpage
  }
}

void setup() {
    Serial.begin(9600); //Start the serial monitor

    Serial.setDebugOutput(true); //Set debug to true (during ESP32 booting)

    Serial.println();
    Serial.println();
    Serial.println();

      for(uint8_t t = 4; t > 0; t--) { //More debugging
          Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
          Serial.flush();
          delay(1000);
      }

    WiFiMulti.addAP("pc123", "test12345"); //Add a WiFi hotspot (addAP = add AccessPoint) (put your own network name and password in here)

    while(WiFiMulti.run() != WL_CONNECTED) { //Here we wait for a successfull WiFi connection untill we do anything else
      Serial.println("Not connected to wifi...");
        delay(100);
    }

    Serial.println("Connected to WiFi successfully!"); //When we have connected to a WiFi hotspot

    //Here we declare all the different events the ESP32 should react to if the server tells it to.
    //a socket.emit("identifier", data) with any of the identifieres as defined below will make the socket call the functions in the arguments below
    webSocket.on("clientConnected", event); //For example, the socket.io server on node.js calls client.emit("clientConnected", ID, IP) Then this ESP32 will react with calling the event function
    webSocket.on("LEDStateChange", changeLEDState);
    webSocket.on("DriveStateChange", changeDriveState);
    webSocket.on("TurnStateChange", changeTurnState);
    webSocket.on("stopDriving", stopDriving);

    //Send data to server/webpage
    webSocket.on("dataRequest", dataRequest); //Listens for the command to send data

    webSocket.begin("192.168.137.181", 2520); //This starts the connection to the server with the ip-address/domainname and a port (unencrypted)
}

//Drive the car forwards or backwards
void Drive(bool Direction){

  if(Direction) {
    Serial.print("w"); //Drive forwards
  } else {
    Serial.print("s"); //Drive backwards
  }
  

  //webSocket.emit("dataFromBoard", "{\"foo\":\"bar\"}");
  
}

//Stop the car
void Stop(bool state){
  Serial.print("x"); //stop
}

//Turn the car left or right (turns with the frontwheels)
void softTurn(bool Direction) {
  
  if(Direction) {
    Serial.print("a"); //Drive left
  }
  else {
    Serial.print("d"); //Drive right
  }
}
void loop() {
  webSocket.loop(); //Keeps the WebSocket connection running 
  //DO NOT USE DELAY HERE, IT WILL INTERFER WITH WEBSOCKET OPERATIONS
  //TO MAKE TIMED EVENTS HERE USE THE millis() FUNCTION OR PUT TIMERS ON THE SERVER IN JAVASCRIPT
}
