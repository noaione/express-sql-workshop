// document onload, no jquery
// ------------------------------------------------------------

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

function POSTJson(url, data) {
    return fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
}

function main() {
    // loginForm
    const $emailBox = document.getElementById('emailBox');
    const $passwordBox = document.getElementById('passBox');
    const loginForm = document.getElementById('registerForm');
    logError(null);
    loginForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        console.info("[Register] Submitting to API...");

        const email = $emailBox.value;
        const password = $passwordBox.value;
        console.info(isEmpty(email), isEmpty(password));
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

        // use modern fetch
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


if (document.readyState === "complete") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}