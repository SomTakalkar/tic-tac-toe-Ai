import random
import socketio
from flask import Flask

# Initialize Flask app and SocketIO server
app = Flask(__name__)
sio = socketio.Server()
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

# Simple AI logic (just for demonstration purposes)
def find_best_move(board, player):
    # AI makes a random move from available spots (this is where your AI logic would go)
    empty_cells = [i for i, x in enumerate(board) if x is None]
    return random.choice(empty_cells)  # Select a random empty cell

@sio.event
def connect(sid, environ):
    print(f'Client connected: {sid}')
    sio.emit('updateGame', {'board': [None] * 9, 'currentPlayer': 'X', 'gameStatus': '', 'mode': 'AI'})  # Initial game state

@sio.event
def playerMove(sid, data):
    board = data['board']
    currentPlayer = data['currentPlayer']
    mode = data['mode']

    # AI move handling (AI plays as 'O')
    if mode == 'AI' and currentPlayer == 'O':  # AI plays as 'O'
        best_move = find_best_move(board, 'O')
        board[best_move] = 'O'

        # Send the updated game state to the frontend with currentPlayer updated to 'X' (human player's turn)
        sio.emit('updateGame', {'board': board, 'currentPlayer': 'X', 'gameStatus': ''})

    # If it's the player's turn (X), we do not trigger AI move here
    elif mode == 'AI' and currentPlayer == 'X':  # Player plays as 'X'
        sio.emit('updateGame', {'board': board, 'currentPlayer': 'O', 'gameStatus': ''})

    # If it's a friend match, just alternate turns
    else:
        # Regular move by player (if playing with a friend)
        next_player = 'O' if currentPlayer == 'X' else 'X'
        sio.emit('updateGame', {'board': board, 'currentPlayer': next_player, 'gameStatus': ''})


@sio.event
def gameResult(sid, data):
    # Handle game result (optional)
    print(f"Game result: {data}")

@sio.event
def disconnect(sid):
    print(f'Client disconnected: {sid}')

if __name__ == "__main__":
    from werkzeug.serving import run_simple
    run_simple('localhost', 4000, app)  # Run Flask app on port 4000
