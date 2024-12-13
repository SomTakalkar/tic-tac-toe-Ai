import random
import sys
import json

# Utility functions
def check_winner(board):
    """Check if there is a winner."""
    win_conditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],  # Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8],  # Columns
        [0, 4, 8], [2, 4, 6]              # Diagonals
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

# Main entry point
if __name__ == "__main__":
    if len(sys.argv) > 1:
        try:
            # Handle script execution with board state passed as argument
            board = json.loads(sys.argv[1])  # Assuming the board state is passed as JSON
            best_move = find_best_move(board, 'O')
            print(best_move)  # Output AI's move as an integer index
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("No board state provided.", file=sys.stderr)
        sys.exit(1)
