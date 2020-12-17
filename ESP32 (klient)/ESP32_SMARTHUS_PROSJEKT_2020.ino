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

//Defining boolean condition
bool heating_condition=true;

//Defining names for pins
int tmp36=35;
int LDR=34;
int led=5;
int heating=4;

//Defining timer which is used for sending data with time-intervals
int time_now;


WiFiMulti WiFiMulti; //Declaring an instance of the WiFiMulti library
SocketIoClient webSocket; //Declaring an instance of the Socket.io library


void event(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload); //Printing message from server in serial monitor
}


//This function turns LED on/off
void changeLEDState(const char * LEDStateData, size_t length) { //Reads severs message
  String dataString(LEDStateData); //Convert message to a string
  int LEDState = dataString.toInt(); //Convert string to an integer(1 is high/true and 0 is low/false)
  analogWrite(led,LEDState*255);//Turns the LED on/off depending on the message from server
  //The following if statement reads the LED to make sure the LED was turned on/off,
  //if LEDState has the same value as the LED, the ESP will send the number 0, which the server will interpret as
  // "Your last command worked, the LED is now on/off!"
  Serial.println(LEDState);
  if (LEDState == digitalRead(led)){
    webSocket.emit("IsLedOkay",(String(0)).c_str()); 
  }
  else{
    webSocket.emit("IsLedOkay",(String(1)).c_str()); //If LEDState and the actual LED do not have the same value, the ESP will send the number 0
    //which will be interpreted as "It did not work, the LED did not change!"
  }
}


//This function is very similar to the "changeLEDState"-function, only this is controlling the heating (which is vizualized as a LED)
void changeHeatState(const char * HeatStateData, size_t length){ //Reads the servers message
  String dataString(HeatStateData); //Connvert message to a string
  int HeatState=dataString.toInt(); //Convert string to an integer (1 is high/true and 0 is low/false)
  Serial.println(HeatState);
  digitalWrite(heating,HeatState); //Turns the heating on/off depending on the message from the server
  heating_condition=HeatState; //Heating_condition will be the same as message from server 
  //if the message is false (meaning off) the automatic regulation of the heating will be overridden, and the heating will be off until the server
  //turns the heating back on again. If the server turns the heating on, the heating will be regulated by the temperature in the room.
    if (HeatState == digitalRead(heating)){ //Checks if the command was executed. Same as in the "changeLEDState"-function
    webSocket.emit("IsHeatOkay",(String(0)).c_str()); //Her får server tilbakemelding, hvis tallet 0 sendes, så skal serveren tolke dette som at alt gikk fint
  }
  else{
    webSocket.emit("IsHeatOkay",(String(1)).c_str()); //Her sender vi 1 hvis noe gikk galt, det skal serveren tolke som at det skjedde en feil
  }
}


void setup() {
  Serial.begin(9600); //Starts serialmonitor
  Serial.setDebugOutput(true); //Set debug to true (during ESP32 booting)
  Serial.println(); //Prints empty lines
  Serial.println();
  Serial.println();

      for(uint8_t t = 4; t > 0; t--) { //More debugging  //This for loop prints a countdown
          Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
          Serial.flush();
          delay(1000);
      }

    WiFiMulti.addAP("Baugerud Wifi", "HippieZara15"); //Connecting to the ESP to the local network (and internet)

    while(WiFiMulti.run() != WL_CONNECTED) { //Waits her until successfull connection to Wifi
      Serial.println("Not connected to wifi...");
        delay(100); //This is the last line where delay is approved
        //Use of delay in the actual loop will interfer with websocket operations
    }

    Serial.println("Connected to WiFi successfully!"); //This shows in the monitor when we have connected to WiFi

    //Here we declare all the different events the ESP32 should react to if the server tells it to.
    webSocket.on("clientConnected", event); //The first argument in the parentheses is the string we will listen for
    //therefore it is important that the in server_no_encrypt.js code sends the exact same string, so that this code will detect it.
    //The second argument in the parentheses is the function we want to use when we receive the string.
    //Example: The server sends ("LEDStateChange", true), then the line underneath will detect "LEDStateChange", and then use the second argument,
    // true, and send it as an argument to the function "changeLEDState" on line 36.
    webSocket.on("LEDStateChange",changeLEDState);
    webSocket.on("HeatStateChange",changeHeatState);
    
    webSocket.begin("84.38.153.29", 2520); //This line connects the ESP to the server. The first argument is the IP-address and the second is which 
    //port to listen to.
    
    time_now=millis(); //Sets the time_now to current time
    analogWrite(heating,0); //Starts with the heating turned off
}

void loop() {

  webSocket.loop(); //Activate socketcommunication/listening 

  //Sensor readings happen under
  int avlesing_temp=analogRead(tmp36);
  float spenning=(avlesing_temp*3.3)/4095; //Convert the TMP36 readings to voltage
  float temp=86.64*spenning-28.68; //Convert the voltage from above to degrees celsius/the numbers are based on testing, not datasheet
  //We have had some problems with the readings from time to time (the sensor might be damaged), but it works good enough because we can detect changes
  //in the temperature.
  int light_read=analogRead(LDR); //Reads the lightsensor

  //The two lines underneath converts the readings to strings
  String temperature=(String(temp));
  String light=(String(light_read/250));

  //Send data from sensors every 10 second --> this is where we use the timer that was set to 0 in the setup
  if (time_now+10000<millis()){
  webSocket.emit("dataFromTmp",temperature.c_str());
  webSocket.emit("dataFromLDR",light.c_str());
  time_now=millis();} //reset time_now to current time

  //Controlling the heating with the TMP36 under
  if (temp<20 && heating_condition==true){ 
    analogWrite(heating,255);
  }
  if (temp>25 or heating_condition==false){
    analogWrite(heating,0);
  }
}
