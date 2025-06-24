const shortenForm = document.getElementById('shortenForm');
const longUrlInput = document.getElementById('long_url');
const resultsContainer = document.getElementById('resultsContainer');
const shortenButton = document.getElementById('shortenButton');
const buttonText = document.getElementById('buttonText');
const loadingSpinner = document.getElementById('loadingSpinner');
const pasteButton = document.getElementById('pasteButton');
const clearButton = document.getElementById('clearButton');
const themeToggle = document.getElementById('themeToggle'); 
const sunIcon = document.getElementById('sunIcon');     
const moonIcon = document.getElementById('moonIcon');   


// Function to set the theme
function setTheme(theme) {
    const htmlElement = document.documentElement;
    if (theme === 'dark') {
        htmlElement.classList.add('dark');
        htmlElement.classList.remove('light');
        localStorage.setItem('theme', 'dark');
        sunIcon.style.display = 'block'; // Show sun icon in dark mode
        moonIcon.style.display = 'none'; // Hide moon icon
    } else {
        htmlElement.classList.remove('dark');
        htmlElement.classList.add('light');
        localStorage.setItem('theme', 'light');
        sunIcon.style.display = 'none'; // Hide sun icon in light mode
        moonIcon.style.display = 'block'; // Show moon icon
    }
}

// Initialize theme based on localStorage or system preference
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    } else {
        setTheme('light');
    }
}

// Event listener for theme toggle button
themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

// Call initializeTheme when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    togglePasteClearButtons(); // Also initialize paste/clear button visibility
});


/**
 * Displays a message (error or success) in the results container.
 * @param {string} type 'success' or 'error'
 * @param {string} message The message content
 * @param {string} [originalUrl] Optional: original URL for success message
 * @param {string} [shortenedUrl] Optional: shortened URL for success message
 */
function displayMessage(type, message, originalUrl = '', shortenedUrl = '') {
   resultsContainer.innerHTML = ''; 
    let htmlContent = '';

    // Apply dark mode classes to success/error messages as well
    const bgColor = type === 'error' ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900';
    const borderColor = type === 'error' ? 'border-red-400 dark:border-red-700' : 'border-green-400 dark:border-green-700';
    const textColor = type === 'error' ? 'text-red-700 dark:text-red-200' : 'text-green-700 dark:text-green-200';
    const linkColor = 'text-blue-600 hover:underline dark:text-blue-400';
    const strongColor = 'font-bold';

    if (type === 'error') {
        htmlContent = `
            <div class="${bgColor} border ${borderColor} ${textColor} px-6 py-4 rounded-lg relative text-left shadow-md" role="alert">
                <strong class="${strongColor}">Oops!</strong>
                <span class="block sm:inline ml-2">${message}</span>
            </div>
        `;
    } else if (type === 'success') {
        htmlContent = `
            <div class="${bgColor} border ${borderColor} ${textColor} px-6 py-4 rounded-lg relative text-left shadow-md">
                <p class="mb-3 text-gray-700 dark:text-gray-300"><strong>Original:</strong> <a href="${originalUrl}" target="_blank" class="${linkColor} break-all text-sm md:text-base">${originalUrl}</a></p>
                <p class="mb-4 text-gray-800 font-semibold dark:text-gray-200"><strong>Shortened:</strong> <a href="${shortenedUrl}" target="_blank" class="${linkColor} break-all text-lg md:text-xl">${shortenedUrl}</a></p>
                <div class="flex items-center justify-between flex-col md:flex-row gap-3">
                    <button
                        onclick="copyToClipboard('${shortenedUrl}')"
                        class="w-full md:w-auto btn-secondary text-white font-bold py-2 px-5 rounded-md text-base transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Copy Short URL
                    </button>
                    <span id="copyMessage" class="ml-0 md:ml-3 text-sm text-gray-600 dark:text-gray-400" style="display:none;"></span>
                </div>
            </div>
        `;
    }
    resultsContainer.innerHTML = htmlContent;
}

/**
 * Handles the form submission using Fetch API (AJAX).
 */
shortenForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent default form submission (page reload)

    const longUrl = longUrlInput.value;

    // Clear previous results/messages
    resultsContainer.innerHTML = '';

    // Show loading state
    buttonText.textContent = 'Shortening...';
    loadingSpinner.style.display = 'block';
    shortenButton.disabled = true; // Disable button during request

    try {
        const response = await fetch('/shorten', { // Send request to the /shorten endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ long_url: longUrl })
        });

        const data = await response.json(); // Parse the JSON response

        if (response.ok) { // Check if the response status is 200 (success)
            displayMessage('success', '', longUrl, data.shortened_url);
        } else {
            // Handle server-side errors (e.g., validation errors from Flask, 400, 500)
            displayMessage('error', data.error_message || 'An unknown error occurred.');
        }
    } catch (error) {
        // Handle network errors or issues with the fetch request itself
        console.error('Fetch error:', error);
        displayMessage('error', 'Network error or server unavailable. Please try again.');
    } finally {
        // Reset button state regardless of success or failure
        buttonText.textContent = 'Shorten URL';
        loadingSpinner.style.display = 'none';
        shortenButton.disabled = false;
    }
});

/**
 * Copies text to the clipboard.
 * Uses document.execCommand('copy') for better compatibility within iframes.
 * @param {string} text The text to copy.
 */
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page
    textarea.style.left = '-9999px'; // Move off-screen
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        const copyMessage = document.getElementById('copyMessage');
        copyMessage.textContent = 'Copied!';
        copyMessage.style.display = 'inline';
        copyMessage.classList.add('copy-message-animated'); // Apply animation
        setTimeout(() => {
            copyMessage.classList.remove('copy-message-animated'); // Remove class after animation
            copyMessage.style.display = 'none';
        }, 2000); // Hide message after 2 seconds
    } catch (err) {
        console.error('Failed to copy text: ', err);
        // Fallback for browsers/environments where execCommand is restricted
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        fallbackMessage.innerHTML = `
            <div class="bg-white p-6 rounded-lg shadow-xl text-center dark:bg-gray-700 dark:text-gray-200">
                <p class="text-gray-800 mb-4 dark:text-gray-200">Could not copy text automatically. Please copy manually:</p>
                <input type="text" value="${text}" readonly class="w-full p-2 border rounded-md text-gray-700 mb-4 select-all dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500" />
                <button onclick="this.parentNode.parentNode.remove()" class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md">Close</button>
            </div>
        `;
        document.body.appendChild(fallbackMessage);
    } finally {
        document.body.removeChild(textarea);
    }
}

/**
 * Pastes content from the clipboard into the long URL input field.
 * Handles clipboard permissions and errors.
 */
async function pasteFromClipboard() {
    try {
        if (navigator.clipboard && navigator.clipboard.readText) {
            const text = await navigator.clipboard.readText();
            longUrlInput.value = text;
            togglePasteClearButtons(); // Update button visibility after pasting
        } else {
            // Fallback for older browsers or non-secure contexts.
            alert("Your browser does not support automatic clipboard pasting. Please paste manually using Ctrl+V (Cmd+V).");
        }
    } catch (err) {
        console.error('Failed to read from clipboard:', err);
        if (err.name === 'NotAllowedError' || err.name === 'SecurityError') {
            alert("Clipboard access denied. Please allow clipboard permissions or paste manually using Ctrl+V (Cmd+V).");
        } else {
            alert("Failed to paste from clipboard. Please paste manually using Ctrl+V (Cmd+V).");
        }
    }
}

/**
 * Clears the content of the long URL input field.
 */
function clearInput() {
    longUrlInput.value = '';
    resultsContainer.innerHTML = ''; // Optionally clear results when input is cleared
    togglePasteClearButtons(); // Update button visibility after clearing
}

/**
 * Toggles the visibility of the Paste and Clear buttons based on input field content.
 */
function togglePasteClearButtons() {
    if (longUrlInput.value.length === 0) {
        pasteButton.style.display = 'block'; // Show paste
        clearButton.style.display = 'none';  // Hide clear
    } else {
        pasteButton.style.display = 'none';  // Hide paste
        clearButton.style.display = 'block'; // Show clear
    }
}

// Add event listener to the input field to constantly check its content
longUrlInput.addEventListener('input', togglePasteClearButtons);