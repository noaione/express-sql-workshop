// safeguard, make sure the js content and function cannot be acessed by the browser
(function() {
    /**
     * Check if value is undefined or null
     * @param {any} value 
     * @returns result
     */
    function isNone(value) {
        return value === undefined || value === null;
    }

    /**
     * Check if string is empty
     * @param {string} str 
     */
    function isEmpty(str) {
        if (isNone(str)) return true;
        return str.replace(/\s/g, '').length < 1;
    }

    /**
     * display error to html page
     * @param {string} message 
     */
    function logError(message) {
        const $errorLog = document.getElementById('errorLog');
        if (isEmpty(message)) {
            $errorLog.style.display = "none";
        } else {
            $errorLog.innerHTML = message;
            $errorLog.style.display = "block";
        }
    }

    /**
     * Send data to an API
     * @param {string} url The URL to send data to
     * @param {any | null} data The data to be sent
     * @returns 
     */
    function POSTJson(url, data) {
        return fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
    }

    // Our main function
    function main() {
        const $emailBox = document.getElementById('emailBox');
        const $passwordBox = document.getElementById('passBox');
        const loginForm = document.getElementById('registerForm');
        logError(null);
        // Override our form submit event
        loginForm.addEventListener("submit", (ev) => {
            // Prevent the default behaviour
            ev.preventDefault();
            console.info("[Register] Submitting to API...");

            const email = $emailBox.value;
            const password = $passwordBox.value;
            // Check if both fields are filled in
            if (isEmpty(email)) {
                logError("Email form is empty!");
                return;
            }
            if (isEmpty(password)) {
                logError("Password form is empty!");
                return;
            }

            const jsonData = {
                email,
                password
            }

            // Send the data to our backend, use POST method to /api/signup
            POSTJson("/api/signup", jsonData).then((res) => res.json()).then((data) => {
                if (data.success) {
                    console.info("[Register] Success!");
                    window.location.href = "/";
                } else {
                    console.info("[Register] Failed!");
                    logError(data.error);
                }
            }).catch((err) => {
                console.error(err);
                logError("Something went wrong!");
            })
        })
    }

    /**
     * Check if our document is ready, if not wait until ready and call our main function
     */
    if (document.readyState === "complete") {
        main();
    } else {
        document.addEventListener("DOMContentLoaded", main);
    }
})();