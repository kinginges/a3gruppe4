#include <analogWrite.h> //Import the analogWrite library for ESP32 so that analogWrite works properly

#include <WiFi.h>//Imports the needed WiFi libraries
#include <WiFiMulti.h> //We need a second one for the ESP32 (these are included when you have the ESP32 libraries)
#include <SocketIoClient.h> //Import the Socket.io library, this also imports all the websockets


bool ledavpa=false;
float temp=0;

WiFiMulti WiFiMulti; //Declare an instane of the WiFiMulti library
SocketIoClient webSocket; //Decalre an instance of the Socket.io library

void event(const char * payload, size_t length) { //Default event, what happens when you connect
  Serial.printf("got message: %s\n", payload);
}
int DataRequestData;
//Under ser vi funksjonen som skal kalles når serveren ber om data fra ESP32
//Kort forklart så leser den forespørselen fra serveren, oversetter forespørselen til tall, og deretter har vi if-setninger der vi avgjør hva vi skal gjøre
//med bakgrunn i tallet som blir sendt fra server
void dataRequest(const char * dataRequestData, size_t length) {//This is the function that is called everytime the server asks for data from the ESP32
  Serial.printf("Datarequest Data: %s\n", DataRequestData);
  Serial.println(DataRequestData);

  //Data conversion
  String dataString(DataRequestData);
  int RequestState = dataString.toInt();

  Serial.print("This is the Datarequest Data in INT: ");
  Serial.println(RequestState);

  if(RequestState == 0) { //If the datarequest gives the variable 0, do this (default)
    
    char str[10]; //Decalre a char array (needs to be char array to send to server)
    itoa(temp, str, 10); //Use a special formatting function to get the char array as we want to, here we put the analogRead value from port 27 into the str variable
    if (ledavpa==false){ //for testing herfra
      analogWrite(4,255);
      ledavpa=true;
    }
    if(ledavpa==true){
      analogWrite(4,0);
      ledavpa=false;
    } //til hit
    //analogWrite(4,255);
    Serial.print("ITOA TEST: ");
    Serial.println(str);
    
    webSocket.emit("dataFromBoard", str); //Here the data is sendt to the server and then the server sends it to the webpage
    //Str indicates the data that is sendt every timeintervall, you can change this to "250" and se 250 be graphed on the webpage
  }
}

int tmp36=35;
int a=0;
float kwh=0;


int time_now;
int timer_varmeovn;
float varmeovnteller=0;


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

    WiFiMulti.addAP("Baugerud Wifi", "HippieZara15"); //Add a WiFi hotspot (addAP = add AccessPoint) (put your own network name and password in here)

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
    time_now=millis();
}

void loop() {
  
  
  webSocket.loop();
  int avlesing_temp=analogRead(tmp36);
  float spenning=(avlesing_temp*3.3)/4095;
  float temp=86.64*spenning-48.68;
  char str[10]; //nytt
  str[0]=temp;
  str[1]=100;
  itoa(temp,str, 10); //nytt
  
  if (time_now+10000<millis()){
  webSocket.emit("dataFromBoard",a);
  time_now=millis();}
  
  if (temp<23 && a==0){
    //analogWrite(4,255);
    //timer_varmeovn=millis();
    //varmeovnteller++;
    //a=1;
  }
  if (timer_varmeovn+10000<millis() && a==1){
    //analogWrite(4,0);
    //kwh=((varmeovnteller*10.0)/3600.0)*1.0;
    //Serial.print("Du har brukt " + String(kwh) + " kilowattimer. \n");
    //a=0;
  }
}
