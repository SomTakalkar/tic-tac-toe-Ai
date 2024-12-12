import random
import socketio
from flask import Flask
import sys
import json
from flask_cors import CORS  # Import Flask-CORS
import os  # Import os for environment variables

from werkzeug.serving import run_simple

# Initialize Flask app and SocketIO server
app = Flask(__name__)  # Initialize Flask app
CORS(app)  # Enable Cross-Origin Resource Sharing (CORS)

# Wrap Flask app with SocketIO
sio = socketio.Server(cors_allowed_origins="*")  # Allow cross-origin for SocketIO
app.wsgi_app = socketio.WSGIApp(sio, app.wsgi_app)

# Utility functions
def check_winner(board):
    """Check if there is a winner."""
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8]   # Columns
    ]
    for condition in win_conditions:
        a, b, c = condition
        if board[a] == board[b] == board[c] and board[a] is not None:
            return board[a]  # Return the winner ('X' or 'O')
    return None  # No winner

def is_draw(board):
    """Check if the board is in a draw state."""
    return all(cell is not None for cell in board)

# Minimax with alpha-beta pruning
def minimax(board, depth, is_maximizing, alpha, beta, player):
    """Minimax algorithm with alpha-beta pruning."""
    opponent = 'X' if player == 'O' else 'O'
    winner = check_winner(board)

    # Base cases: check for terminal states
    if winner == player:  # AI wins
        return 10 - depth
    if winner == opponent:  # Opponent wins
        return depth - 10
    if is_draw(board):  # Draw
        return 0

    # Recursive case
    if is_maximizing:
        max_eval = float('-inf')
        for i, cell in enumerate(board):
            if cell is None:  # Check empty cell
                board[i] = player
                eval = minimax(board, depth + 1, False, alpha, beta, player)
                board[i] = None  # Undo move
                max_eval = max(max_eval, eval)
                alpha = max(alpha, eval)
                if beta <= alpha:  # Prune branch
                    break
        return max_eval
    else:
        min_eval = float('inf')
        for i, cell in enumerate(board):
            if cell is None:  # Check empty cell
                board[i] = opponent
                eval = minimax(board, depth + 1, True, alpha, beta, player)
                board[i] = None  # Undo move
                min_eval = min(min_eval, eval)
                beta = min(beta, eval)
                if beta <= alpha:  # Prune branch
                    break
        return min_eval

def find_best_move(board, player):
    """Find the best move for the AI using Minimax with alpha-beta pruning."""
    if board.count(None) == 9:  # AI first move
        return random.choice([0, 2, 6, 8, 4])  # Corners or center

    best_score = float('-inf')
    best_move = None

    for i, cell in enumerate(board):
        if cell is None:  # Check empty cell
            board[i] = player
            move_score = minimax(board, 0, False, float('-inf'), float('inf'), player)
            board[i] = None  # Undo move

            if move_score > best_score:
                best_score = move_score
                best_move = i

    return best_move

# Socket.IO events
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
        if best_move is not None:
            board[best_move] = 'O'

        # Check if the AI wins or the game ends
        winner = check_winner(board)
        if winner:
            sio.emit('updateGame', {'board': board, 'currentPlayer': '', 'gameStatus': f'Player {winner} wins!'})
        elif is_draw(board):
            sio.emit('updateGame', {'board': board, 'currentPlayer': '', 'gameStatus': 'It\'s a draw!'})
        else:
            sio.emit('updateGame', {'board': board, 'currentPlayer': 'X', 'gameStatus': ''})

    # Player's turn (X)
    elif mode == 'AI' and currentPlayer == 'X':
        sio.emit('updateGame', {'board': board, 'currentPlayer': 'O', 'gameStatus': ''})

    # If it's a friend match, alternate turns
    else:
        next_player = 'O' if currentPlayer == 'X' else 'X'
        sio.emit('updateGame', {'board': board, 'currentPlayer': next_player, 'gameStatus': ''})

@sio.event
def gameResult(sid, data):
    print(f"Game result: {data}")

@sio.event
def disconnect(sid):
    print(f'Client disconnected: {sid}')

# Entry point for Render
if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Handle script execution with board state passed as argument
        board = json.loads(sys.argv[1])  # Assuming the board state is passed as JSON
        best_move = find_best_move(board, 'O')
        print(best_move)  # Output AI's move as an integer index
    else:
        port = int(os.environ.get("PORT", 4000))  # Render provides the PORT env variable
        run_simple('0.0.0.0', port, app)  # Run Flask app on Render
