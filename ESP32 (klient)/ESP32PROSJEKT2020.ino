//This code includes:
// * One LDR sensor
// * One TMP36 sensor
// * One led
// * One heatingpanel (symbolized with a led)

//Including libraries
#include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly
#include <WiFi.h>//Imports the needed WiFi libraries
#include <WiFiMulti.h> //We need a second one for the ESP32 (these are included when you have the ESP32 libraries)
#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets

//Defining boolean conditions
bool led_state=false;
bool heating_state=false;
bool heating_condition=true;

//Defining names for pins
int tmp36=35;
int LDR=34;
int led=5;
int heating=4;

//Defining timer which is used for sending data with time intervals
int time_now;

WiFiMulti WiFiMulti; //Declaring an instane of the WiFiMulti library
SocketIoClient webSocket; //Declaring an instance of the Socket.io library

void event(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload); //Printing message from server in serial monitor
}

//This function takes arguments from the server, depending on the argument it recieves (which will be an integer), the function will do something
void dataRequest(const char * DataRequestData, size_t length) {
  Serial.printf("Datarequest Data: %s\n", DataRequestData); //The request will be printed in the serial monitor
  Serial.println(DataRequestData);

  //Data conversion
  String dataString(DataRequestData);
  int RequestState = dataString.toInt();

  Serial.print("This is the Datarequest Data in INT: ");
  Serial.println(RequestState); //The request is translated to int, and is printed in the serial monitor

  if(RequestState == 0) { //the ESP will turn the led on/off depending on last state
    if (led_state==false){ 
      analogWrite(led,255);
      led_state=true;
    }
    else{
      analogWrite(led,0);
      led_state=false;
    }
  }
  if (RequestState == 1) { //the ESP will turn the heating panel on/off depending on last state
    if (heating_condition==false){
      heating_condition=true;
    }
    else{
      heating_condition=false; //if the heating panel is being turned off, it will be off even though the temperaturereadings are very low.
    }
  }
}




void setup() {
  Serial.begin(9600);
  Serial.setDebugOutput(true); //Set debug to true (during ESP32 booting)
  Serial.println();
    Serial.println();
    Serial.println();

      for(uint8_t t = 4; t > 0; t--) { //More debugging
          Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
          Serial.flush();
          delay(1000);
      }

    WiFiMulti.addAP("Baugerud Wifi", "HippieZara15"); //Connecting to the ESP to internet

    while(WiFiMulti.run() != WL_CONNECTED) { //Here we wait for a successfull WiFi connection untill we do anything else
      Serial.println("Not connected to wifi...");
        delay(100);
    }

    Serial.println("Connected to WiFi successfully!"); //When we have connected to a WiFi hotspot

    //Here we declare all the different events the ESP32 should react to if the server tells it to.
    //a socket.emit("identifier", data) with any of the identifieres as defined below will make the socket call the functions in the arguments below
    webSocket.on("clientConnected", event); //For example, the socket.io server on node.js calls client.emit("clientConnected", ID, IP) Then this ESP32 will react with calling the event function
    
    //Send data to server/webpage
    webSocket.on("dataRequest", dataRequest); //Listens for the command to send data

    webSocket.begin("84.38.153.29", 2520); //This starts the connection to the server with the ip-address/domainname and a port (unencrypted)
    time_now=millis(); //sets the time_now to current time
}

void loop() {

  webSocket.loop(); //Activate socketcommunication

  //Sensor readings happen under
  int avlesing_temp=analogRead(tmp36);
  float spenning=(avlesing_temp*3.3)/4095;
  float temp=86.64*spenning-48.68;
  int light_read=analogRead(LDR);
  String temperature=(String(temp));
  String light=(String(light_read));

  //Send data from sensors every 10 second
  if (time_now+10000<millis()){
  webSocket.emit("dataFromTmp",temperature.c_str());
  webSocket.emit("dataFromLDR",light.c_str());
  time_now=millis();} //reset time_now to current time

  //Controlling the heating with the TMP36 under
  if (temp<20 && heating_condition==true){
    analogWrite(heating,255);
    heating_state=true;
  }
  if (temp>23 or heating_condition==false){
    analogWrite(heating,0);
    heating_state=false;
  }
}
