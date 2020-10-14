from socket import *

global connection_socket
must_run=True

def start_server(): #Denne funksjonen starter opp serveren
    global connection_socket #Gjør den globale variabelen tilgjengelig som en lokal variabel i funksjonen
    print("Starting TCP server...") #Gir beskjed om oppstart
    welcome_socket=socket(AF_INET,SOCK_STREAM) #Kobler til sockets (internett og TCP-protokoll)
    welcome_socket.bind(("",5678)) #Linker klienten til serveren i port 5678
    #Det skal ikke stå noe i "", dette bestemmes av klienten
    welcome_socket.listen(1) #Klient sin plass i køa
    print('server ready for client connection') #Gir beskjed om at serveren er klar for tilkobling
    connection_socket, client_address=welcome_socket.accept() #three way handshake
    print('Client connected from',client_address) #Gir informasjon om at klienten er blitt tilkoblet fra en ip-adresse

def read_request(): #Denne funksjonen leser henvendelser fra klient

    try:
        global connection_socket #Gjør global variabel tilgjengelig
        #console.log(connection_socket) #SLETT DENNE NÅR DU ER FERDIG
        request_full = connection_socket.recv(1000).decode() #mottar og dekoder i samme linje
        request=request_full.strip('\n')
        print('Message from client:', request) #printer henvendelsen fra klient

        return request #Funksjonen gir tilbake en dekodet versjon av henvendelsen til klienten
    except ConnectionResetError:
        print('Client cdisconnected') #Hvis klienten blir logget av vil denne errormeldingen dukke opp
        return False

def send_response(response): #Denne funksjonen konverterer respons fra serveren til et format som kan sendes til klient
    global connection_socket
    sende=(str(response)).encode() #enkoder
    connection_socket.send(sende) #sender

def process_request(request): #går gjennom henvendelse fra klient for å avgjøre hva den skal gjøre videre
    try:
        response = eval(request)
        return response
    except NameError:
        response = "wrong format"
        return response
    except TypeError:
        response = "wrong format"
        return response

    except SyntaxError:
        print("Client has disconnected from the server")
        return False


def kick(): #en ikke ferdigstilt funksjon som skal kaste ut klient
    global connection_socket
    send = "Session ended"
    connection_socket.send(send.encode())
    #kick


def run_server(): #en sammenslåing av funksjonene over
    request = read_request()
    response = process_request(request)
    if response == False:
        return False
    else:
        send_response(response)


# Main entrypoint of the script
if __name__ == '__main__':
    start_server()
    while must_run == True:
        run_server()