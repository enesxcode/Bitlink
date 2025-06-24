from flask import Flask, render_template, request, jsonify
import pyshorteners
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24) # Used for session management, not strictly needed for this simple API but good practice

# Initialize the URL shortener once when the app starts
shortener = pyshorteners.Shortener()

@app.route('/', methods=['GET'])
def index():
    """
    Renders the main HTML page. This route only responds to GET requests.
    The form submission will be handled by JavaScript to a different endpoint.
    """
    return render_template('index.html')

@app.route('/shorten', methods=['POST'])
def shorten_url_api():
    """
    API endpoint to handle URL shortening requests via AJAX (POST).
    It expects a JSON payload with 'long_url'.
    Returns a JSON response with the 'shortened_url' or 'error_message'.
    """
    # Ensure the request data is in JSON format
    if not request.is_json:
        return jsonify({"error_message": "Request must be JSON"}), 400

    data = request.get_json()
    long_url = data.get('long_url')

    # Basic validation for input URL
    if not long_url:
        return jsonify({"error_message": "Please provide a URL to shorten."}), 400

    try:
        # Attempt to shorten the URL using is.gd service
        shortened_url = shortener.isgd.short(long_url)
        return jsonify({"shortened_url": shortened_url}), 200 # Success response
    except pyshorteners.exceptions.ShorteningErrorException as e:
        # Specific error from pyshorteners (e.g., invalid URL format, service issue)
        return jsonify({"error_message": f"Error shortening URL: {e}"}), 500
    except Exception as e:
        # Catch any other unexpected errors
        return jsonify({"error_message": f"An unexpected server error occurred: {e}"}), 500

if __name__ == '__main__':
    # Run the Flask app in debug mode (development only!)
    app.run(debug=True)
