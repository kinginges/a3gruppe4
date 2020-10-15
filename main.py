from socket import *

states = [
    "disconnected",  # Connection to a chat server is not established
    "connected",  # Connected to a chat server, but not authorized (not logged in)
    "authorized"  # Connected and authorized (logged in)
]
TCP_PORT = 1300  # TCP port used for communication
SERVER_HOST = "datakomm.work"  # Set this to either hostname (domain) or IP address of the chat server

# --------------------
# State variables
# --------------------
current_state = "disconnected"  # The current state of the system
# When this variable will be set to false, the application will stop
must_run = True
# Use this variable to create socket connection to the chat server
# Note: the "type: socket" is a hint to PyCharm about the type of values we will assign to the variable
client_socket=socket(AF_INET, SOCK_STREAM)  # type: socket


def quit_application(): #STUDER DENNE
    global must_run
    must_run = False


def send_command(command, arguments): #This function sends a command to the server
    #While the command has to be one of the commands that is made by the server, the argument will vary depending
    #on the command that is being sent. In some of the commands there will be no arguments.

    global client_socket #Makes the variable client_socket available for use inside the function

    if arguments == None: #As mentioned over, there are in some cases no need for arguments. Here we determine whether
        #there is an argument included when the function is called for.
        #If there is no argument, the function will only send the command.
        cmd_to_send = command + "\n"  #Making the full message that will be sent to the server
        #We have to include '\n' (new line) in the command/message that is being sent to the server
    else:
        cmd_to_send = command + " " + arguments + "\n"
    cmd_as_bytes = cmd_to_send.encode() #Encoding the message to the server
    client_socket.send(cmd_as_bytes) #Sending the message to the server
    pass


def read_one_line(sock):
#This function reads one line-messages
    newline_received = False #Start with a local variable that is been defined false,
    message = "" #and an empty string-variable
    while not newline_received: #Inside this while-loop the function will continuously read one bit at a time,
        #and add that bit to the variable called message
        character = sock.recv(1).decode()
        if character == '\n': #Note: \n is ONE bit
            #If the bit is being translated to \n (new line), the variable that was defined as Fale above, will be
            #redefined as True, and we will skip out of the while-loop
            newline_received = True
        elif character == '\r':
            pass
        else:
            message += character
    return message #The function returns the full message


def get_servers_response():
#This function implents the read_one_line function to specifically get the servers response
    global client_socket #Makes the variable client_socket available for use inside the function
    server_response = read_one_line(client_socket)
    return server_response


def connect_to_server():
    # Must have these two lines, otherwise the function will not "see" the global variables that we will change here
    global client_socket
    global current_state

    try:
        client_socket.connect((SERVER_HOST, TCP_PORT)) #Connects to the server
        current_state = states[1] #Change current state to 'connected'
    except IOError as e: #If any error occurs the program will print 'An error occured:' and the specific error
        print("An error occured:", e)

    send_command("sync", "") #Send command that we want a synchronous mode

    servers_response = get_servers_response() #Read servers response
    if servers_response == "modeok": #If the server switches to synchronous mode as we asked, the response will be
        # as follows:
        print("Managed to switch to synchronous mode")
    else: #If the server did not managed, the response will be as follows:
        print("Error! Didn't manage to switch to synchronous mode")


def disconnect_from_server(): #Disconnects from server
    # Must have these two lines, otherwise the function will not "see" the global variables that we will change here
    global client_socket
    global current_state

    try:
        client_socket.close() #Command that disconnects
        current_state = states[0] #Change current state to 'disconnected'
    except IOError as e: #If error occurs, the program will print the spesific error
        print("An error occured:", e)

    pass


def authorisation(): #This function lets the user choose their own personal username
    global current_state

    username = str(input("Enter your username: ")) #Asks the user to enter their username
    send_command("login", username) #Sends the login-command to the server followed by the choosen username

    servers_response = get_servers_response() #Reads servers response
    if servers_response == "modeok": #If the username is accepted, the server vil respond with 'modeok'
        print("You've succesfully logged in!")
    else:
        print(servers_response)
    current_state = states[2] #changes the current state to 'authorized'

def public_message(): #This function sends a public message

    message = str(input("Enter your message: "))
    send_command("msg", message) #Sends the command that will send the message public followed by the message made by the user

    servers_response = get_servers_response()  #checks if the public message was sent
    if servers_response == "msgok":
        print("Your message was sent!")
    else:
        print(servers_response)

def private_message(): #Sends a private message to a specific user, works almost the same way as a public message

    receiver = str(input("Enter the recipients name: "))
    message = str(input("Enter your message: "))
    argument = receiver + " " + message
    send_command("privmsg", argument)

    servers_response = get_servers_response()
    if servers_response == "msgok":
        print("Your message was sent!")
    else:
        print(servers_response)

def check_inbox(): #Checks inbox
    global client_socket

    send_command("inbox", None) #Sends command to the server that the user wants to check their inbox
    response = str(client_socket.recv(1000).decode()) #The first time we read the servers response, the server will only respond
    #with 'inbox' and number of messages in the inbox
    if 'inbox 0' in response: #If there are no new messages, the program will respond with 'No new messages'
        print('No new messages')
    else: #If there are new messages in the inbox, the will be printed to the user
        response_2 = client_socket.recv(1000).decode() #The second time we read the servers response, we will get the actual
    # content of the inbox
        print(response)
        print(response_2)



def help_me(): #This functions returns the commands the server support
    send_command("help", None)
    print(get_servers_response())

def members(): #Sends a list of users active on the server
    send_command("users", None)
    print(get_servers_response())

#Here are the structure of the program (avilable actions). Which of the available actions the user sees depends on
#what the curren state is. In the end of every action we have written in the function that will be called if the
#the user select the said action
available_actions = [
    {
        "description": "Connect to a chat server",
        "valid_states": ["disconnected"],
        "function": connect_to_server
    },
    {
        "description": "Disconnect from the server",
        "valid_states": ["connected", "authorized"],
        "function": disconnect_from_server
    },
    {
        "description": "Authorize (log in)",
        "valid_states": ["connected", "authorized"],
        "function": authorisation
    },
    {
        "description": "Send a public message",
        "valid_states": ["connected", "authorized"],
        "function": public_message
    },
    {
        "description": "Send a private message",
        "valid_states": ["connected", "authorized"],
        "function": private_message
    },
    {
        "description": "Read messages in the inbox",
        "valid_states": ["authorized"],
        "function": check_inbox
    },
    {
        "description": "See list of users",
        "valid_states": ["connected", "authorized"],
        "function": members
    },
    {
        "description": "Help",
        "valid_states": ["connected", "authorized"],
        # help
        "function": help_me
    },
    {
        "description": "Get a joke",
        "valid_states": ["connected", "authorized"],
        "function": None
    },
    {
        "description": "Quit the application",
        "valid_states": ["disconnected", "connected", "authorized"],
        "function": quit_application
    },
]


def run_chat_client():
    """ Run the chat client application loop. When this function exists, the application will stop """

    while must_run:
        print_menu()
        action = select_user_action()
        perform_user_action(action)
    print("Thanks for watching. Like and subscribe! 👍")


def print_menu(): #This is the function that prints the available actions as a menu
    """ Print the menu showing the available options """
    print("==============================================")
    print("What do you want to do now? ")
    print("==============================================")
    print("Available options:")
    i = 1
    for a in available_actions:
        if current_state in a["valid_states"]:
            # Only hint about the action if the current state allows it
            print("  %i) %s" % (i, a["description"]))
        i += 1
    print()


def select_user_action():
    """
    Ask the user to choose and action by entering the index of the action
    :return: The action as an index in available_actions array or None if the input was invalid
    """
    number_of_actions = len(available_actions)
    hint = "Enter the number of your choice (1..%i):" % number_of_actions
    choice = input(hint)
    # Try to convert the input to an integer
    try:
        choice_int = int(choice)
    except ValueError:
        choice_int = -1

    if 1 <= choice_int <= number_of_actions:
        action = choice_int - 1
    else:
        action = None

    return action


def perform_user_action(action_index):
    """
    Perform the desired user action
    :param action_index: The index in available_actions array - the action to take
    :return: Desired state change as a string, None if no state change is needed
    """
    if action_index is not None:
        print()
        action = available_actions[action_index]
        if current_state in action["valid_states"]:
            function_to_run = available_actions[action_index]["function"]
            if function_to_run is not None:
                function_to_run()
            else:
                print("Internal error: NOT IMPLEMENTED (no function assigned for the action)!")
        else:
            print("This function is not allowed in the current system state (%s)" % current_state)
    else:
        print("Invalid input, please choose a valid action")
    print()
    return None

# Entrypoint for the application. In PyCharm you should see a green arrow on the left side.
# By clicking it you run the application.
if __name__ == '__main__':
    run_chat_client()