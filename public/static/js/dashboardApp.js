/**
 * Generate random password
 * @param {boolean} lowerLetter Enable lowercased letter
 * @param {boolean} capitalLetter Enable capital letter
 * @param {boolean} number Enable number
 * @param {boolean} symbol Enable symbol
 * @param {number} length Password length
 */
function generatePassword(lowerLetter, capitalLetter, number, symbol, length = 8) {
    const lowerCase = "abcdefghijklmnopqrstuvwxyz";
    const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*_-+=";

    // Password ratio, from 0 to 1, total all of them will be 1
    let lowerRatio = 0.4;
    let upperRatio = 0.2;
    let numberRatio = 0.2;
    let symbolRatio = 0.2;

    // Change ratio amount if any of them is disabled
    if (!lowerLetter) {
        lowerRatio = 0;
    }
    if (!capitalLetter) {
        upperRatio = 0;
    }
    if (!number) {
        numberRatio = 0;
    }
    if (!symbol) {
        symbolRatio = 0;
    }

    // Calculate total ratio
    const totalRatio = lowerRatio + upperRatio + numberRatio + symbolRatio;
    if (totalRatio === 0) {
        return "";
    }
    // Calculate ratio for each type
    lowerRatio /= totalRatio;
    upperRatio /= totalRatio;
    numberRatio /= totalRatio;
    symbolRatio /= totalRatio;

    let password = "";

    const lowerLength = Math.floor(length * lowerRatio);
    const upperLength = Math.floor(length * upperRatio);
    const numberLength = Math.floor(length * numberRatio);
    const symbolLength = Math.floor(length * symbolRatio);

    const randomGet = (str, len) => {
        if (len < 1) return "";
        let result = "";
        for (let i = 0; i < len; i++) {
            result += str.charAt(Math.floor(Math.random() * str.length));
        }
        return result;
    }

    const shuffle = (str) => {
        return str.split('').sort(function () {
            return 0.5 - Math.random();
        }).join('');
    }

    // Generate password
    password += randomGet(lowerCase, lowerLength);
    password += randomGet(upperCase, upperLength);
    password += randomGet(numbers, numberLength);
    password += randomGet(symbols, symbolLength);

    return shuffle(password);
} // <-- the reason it is not in the below safeguard is because I want to test it from the browser console itself.

// safeguard, make sure the js content and function cannot be acessed by the browser
(function() {
    /**
     * Our custom state object, simulating React state object.
     * This state basically holds the data that we will use to share between functions.
     */
    const DashboardState = {
        /** @type {number | null} */
        deleted: null,
        /** @type {string | null} */
        editing: null,
        // allow us to lock the modal so it cannot be closed.
        modalLock: {
            modalError: false,
            modalDelete: false,
            modalAdd: false,
            modalEdit: false,
        }
    }

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
     * Fetch data from our backend server in JSON format
     * @param {url} url The URL to be fetched from
     * @returns Fetched data, in Promise format
     */
    function GETJson(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json"
            },
        }).then((resp) => resp.json());
    }

    /**
     * Send data to an API
     * @param {"GET" | "POST" | "DELETE" | "PUT"} method HTTP Method
     * @param {string} url The URL to send data to
     * @param {any | null} data The data to be sent
     * @returns 
     */
    function SENDJson(method, url, data = null) {
        const fetchStats = {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
        }
        if (!isNone(data)) {
            fetchStats.body = JSON.stringify(data);
        }
        return fetch(url, fetchStats);
    }

    /**
     * Handle password deletion
     * @param {number} passwordId the password id
     */
     function handlePasswordDelete(passwordId) {
        const $tr = document.querySelector(`tr[data-password-id="${passwordId}"]`);
        const $btnDelete = $tr.querySelector("button[data-button-type='delete']");
        $btnDelete.setAttribute("disabled", "disabled");
        console.info("[Delete]", passwordId);
        // Send deletion request to the backend server
        SENDJson("DELETE", "/api/passwords", {id: passwordId}).then((resp) => resp.json()).then((data) => {
            $btnDelete.removeAttribute("disabled");
            DashboardState.deleted = null;
            if (data.success) {
                $tr.remove();
            } else {
                displayError(data.error);
            }
        })
    }

    /**
     * Show specific modal to the user
     * @param {string} modalId Modal ID to be displayed
     */
    function showModal(modalId) {
        const $modal = document.getElementById(modalId);
        $modal.classList.remove("hidden");
    }

    /**
     * Hide/close specific modal to the user
     * @param {string} modalId Modal ID to be closed
     */
    function hideModal(modalId) {
        const $modal = document.getElementById(modalId);
        $modal.classList.add("hidden");
    }

    /**
     * Generate a table row for our password list!
     * @param {number} passwordId Password ID
     * @param {string} email The email
     * @param {string} password plaintext password
     */
    function generateTableRow(passwordId, email, password) {
        // Create our base <tr> element
        const $tr = document.createElement("tr");
        $tr.classList.add("border-b-[1px]", "border-gray-500");

        // Create our email element
        const $tdEmail = document.createElement("td");
        $tdEmail.classList.add("text-center", "p-2");
        $tdEmail.innerText = email;

        // Create our password element
        const $tdPassword = document.createElement("td");
        $tdPassword.classList.add("p-2", "text-center");

        // Create our inner password, so it only select the password itself instead of the whole div object
        const $innerPassword = document.createElement("span");
        $innerPassword.classList.add("blur-md", "hover:blur-none", "transition", "select-all");
        $innerPassword.innerText = password;
        $tdPassword.appendChild($innerPassword);

        // Create our actions element wrapper
        const $tdActions = document.createElement("td");
        $tdActions.classList.add("p-2", "py-4");
        const $divActionsInner = document.createElement("div");
        $divActionsInner.classList.add("flex", "flex-col", "justify-center", "gap-2");

        // Create our edit button
        const $buttonEdit = document.createElement("button");
        $buttonEdit.classList.add("bg-teal-400", "hover:bg-teal-500", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold", "select-none");
        $buttonEdit.innerText = "Edit";
        $buttonEdit.addEventListener("click", () => {
            // Add our edit button event handler here
            // First we add the password ID to our editing state (simulating React)
            DashboardState.editing = passwordId;
            document.getElementById("genPasswordValueEdit").value = password;
            // Now, let's check our old password
            // See if it contains lowercase letters
            const $checkLower = document.querySelector(`#modalEdit input[name='genPassLower']`);
            // See if it contains uppercase letters
            const $checkUpper = document.querySelector(`#modalEdit input[name='genPassUpper']`);
            // See if it contains any numbers
            const $checkNum = document.querySelector(`#modalEdit input[name='genPassNum']`);
            // See if it contains any symbols
            const $checkSym = document.querySelector(`#modalEdit input[name='genPassSym']`);
            // Check our password length
            const $checkLength = document.querySelector(`#modalEdit input[name='genPassLength']`);
            $checkLower.checked = hasAnyLowercase(password);
            $checkUpper.checked = hasAnyUppercase(password);
            $checkNum.checked = hasAnyNumber(password);
            $checkSym.checked = hasAnySymbol(password);
            $checkLength.value = password.length.toString();
            document.getElementById("emailBoxEdit").value = email;
            // After checking, now show the modal
            showModal("modalEdit");
        });
        // Add custom attribute as helper when we will use querySelector to replace element or delete it
        $buttonEdit.setAttribute("data-password-id", passwordId.toString());
        $buttonEdit.setAttribute("data-button-type", "edit");

        // Create our delete button
        const $buttonDelete = document.createElement("button");
        $buttonDelete.classList.add("bg-red-400", "hover:bg-red-500", "disabled:bg-red-500", "disabled:cursor-not-allowed", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold", "select-none");
        $buttonDelete.innerText = "Delete";
        $buttonDelete.addEventListener("click", () => {
            // Handle our deletion, first set the state like the edit button and show the modal
            DashboardState.deleted = passwordId;
            showModal("modalDelete");
        });
        // Add custom attribute as helper when we will use querySelector to replace element or delete it
        $buttonDelete.setAttribute("data-password-id", passwordId.toString());
        $buttonDelete.setAttribute("data-button-type", "delete");

        // Add all of them to our base wrapper
        $divActionsInner.appendChild($buttonEdit);
        $divActionsInner.appendChild($buttonDelete);
        $tdActions.appendChild($divActionsInner);
        $tr.appendChild($tdEmail);
        $tr.appendChild($tdPassword);
        $tr.appendChild($tdActions);
        // Set password-id to our element
        $tr.setAttribute("data-password-id", passwordId.toString());
        // Return the result
        return $tr;
    }

    /**
     * Check if all of our password generator modifier is unchecked
     * @param {"modalAdd" | "modalEdit"} prefix the modal we're editing
     * @returns {boolean} true if all modifier is unchecked, false otherwise
     */
    function isAllGenModifierOff(prefix) {
        const $checkLower = document.querySelector(`#${prefix} input[name='genPassLower']`);
        const $checkUpper = document.querySelector(`#${prefix} input[name='genPassUpper']`);
        const $checkNum = document.querySelector(`#${prefix} input[name='genPassNum']`);
        const $checkSym = document.querySelector(`#${prefix} input[name='genPassSym']`);

        return !$checkLower.checked && !$checkUpper.checked && !$checkNum.checked && !$checkSym.checked;
    }

    /**
     * Disable our modifier button so user cannot check/uncheck them
     * @param {"modalAdd" | "modalEdit"} prefix the modal we're editing
     */
    function disablePasswordModifierCheckbox(prefix) {
        const $checkLower = document.querySelector(`#${prefix} input[name='genPassLower']`);
        const $checkUpper = document.querySelector(`#${prefix} input[name='genPassUpper']`);
        const $checkNum = document.querySelector(`#${prefix} input[name='genPassNum']`);
        const $checkSym = document.querySelector(`#${prefix} input[name='genPassSym']`);
        const $checkLength = document.querySelector(`#${prefix} input[name='genPassLength']`);

        $checkLower.setAttribute("disabled", "true");
        $checkUpper.setAttribute("disabled", "true");
        $checkNum.setAttribute("disabled", "true");
        $checkSym.setAttribute("disabled", "true");
        $checkLength.setAttribute("disabled", "true");
    }

    /**
     * Enable our modifier button so user cannot check/uncheck them
     * @param {"modalAdd" | "modalEdit"} prefix the modal we're editing
     */
    function enablePasswordModifierCheckbox(prefix) {
        const $checkLower = document.querySelector(`#${prefix} input[name='genPassLower']`);
        const $checkUpper = document.querySelector(`#${prefix} input[name='genPassUpper']`);
        const $checkNum = document.querySelector(`#${prefix} input[name='genPassNum']`);
        const $checkSym = document.querySelector(`#${prefix} input[name='genPassSym']`);
        const $checkLength = document.querySelector(`#${prefix} input[name='genPassLength']`);

        $checkLower.removeAttribute("disabled");
        $checkUpper.removeAttribute("disabled");
        $checkNum.removeAttribute("disabled");
        $checkSym.removeAttribute("disabled");
        $checkLength.removeAttribute("disabled");
    }

    /**
     * Should we close our modal or not!
     * @param {string} modalId Modal ID
     * @param {PointerEvent} ev Event
     */
    function shouldCloseOrNot(modalId, ev) {
        if (DashboardState.modalLock[modalId]) {
            return;
        }
        let shouldCloseModal = true;
        ev.composedPath().forEach((el) => {
            const modalView = modalId + "View";
            if (el.id === modalView) {
                shouldCloseModal = false;
            }
        });
        if (shouldCloseModal) {
            hideModal(modalId);
        }
    }

    /**
     * Display error message to the user using the modal
     * @param {string} message Error message to be displayed
     */
    function displayError(message) {
        const $modalErrorTextView = document.getElementById("modalErrorTextView");
        $modalErrorTextView.innerText = message;
        showModal("modalError");
    }

    /**
     * Check if our password contain any lowercase letter or not
     * @param {string} str String to be checked
     * @returns {boolean} true if contain lowercase letter, false otherwise
     */
    function hasAnyUppercase(str) {
        // Check by lowercasing everything and see if it's the same
        // If yes, that means that all are lowercase and no uppercase
        return str.toLowerCase() !== str;
    }

    /**
     * Check if our password contain any uppercase letter or not
     * @param {string} str String to be checked
     * @returns {boolean} true if contain uppercase letter, false otherwise
     */
    function hasAnyLowercase(str) {
        // Check by uppercase everything and see if it's the same
        // If yes, that means that all are uppercase and no lowercase
        return str.toUpperCase() !== str;
    }

    /**
     * Check if our password contain any numbers or not
     * @param {string} str String to be checked
     * @returns {boolean} true if contain numbers, false otherwise
     */
    function hasAnyNumber(str) {
        // Use regex to check if we have any number
        return /\d/.test(str);
    }

    /**
     * Check if our password contain any symbols or not
     * @param {string} str String to be checked
     * @returns {boolean} true if contain symbols, false otherwise
     */
    function hasAnySymbol(str) {
        // Regex, basically invert checking anything outside capital, lowercase, and numbers
        return /[^a-zA-Z\d]/.test(str);
    }

    /**
     * Regenerate password and put it in the modal
     * @param {"modalAdd" | "modalEdit"} prefix the modal we're editing
     */
    function cycleGeneratedPassword(prefix) {
        // Check prefix first
        const extraText = prefix.includes("Edit") ? "Edit" : "";
        const $btnRegenPass = document.getElementById("btnRegenPass" + extraText);
        const $checkLength = document.querySelector(`#${prefix} input[name='genPassLength']`);
        const isAllOff = isAllGenModifierOff(prefix);
        // Check the modifier, if all off disable everything and return.
        if (isAllOff) {
            $btnRegenPass.setAttribute("disabled", "true");
            $checkLength.setAttribute("disabled", "true");
            return;
        } else {
            $btnRegenPass.removeAttribute("disabled");
            $checkLength.removeAttribute("disabled");
        }
        // Check our modifier, and length to generate password
        const $checkLower = document.querySelector(`#${prefix} input[name='genPassLower']`);
        const $checkUpper = document.querySelector(`#${prefix} input[name='genPassUpper']`);
        const $checkNum = document.querySelector(`#${prefix} input[name='genPassNum']`);
        const $checkSym = document.querySelector(`#${prefix} input[name='genPassSym']`);
        const passLength = parseInt($checkLength.value) || 8;
        const password = generatePassword($checkLower.checked, $checkUpper.checked, $checkNum.checked, $checkSym.checked, passLength);
        const $passValue = document.getElementById("genPasswordValue" + extraText);
        // check if node type is <input>
        if ($passValue.tagName === "INPUT") {
            $passValue.value = password;
        } else {
            $passValue.innerText = password;
        }
    }

    // Our main function
    function main() {
        const $tableBody = document.getElementById("passwordView");
        // Get our password list from the API, then append to our table
        GETJson("/api/passwords")
            .then(
                (data) => {
                /**
                 * @type {import ("../../../src/types").IPassword[]}
                 */
                const results = data.data;
                results.forEach((pwd) => {
                    const $tr = generateTableRow(pwd.id, pwd.email, pwd.password);
                    $tableBody.appendChild($tr);
                })
            }
        )
    
        // Add event listener to our modal
        const $deleteModal = document.getElementById("modalDelete");
        $deleteModal.onclick = (ev) => {
            shouldCloseOrNot("modalDelete", ev);
        }
        const $modalDeleteBtn = document.querySelector(".modal-delete-btn");
        const $modalDeleteCancelBtn = document.querySelector(".modal-delete-cancel-btn");
        $modalDeleteBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            console.info("delete", DashboardState.deleted);
            hideModal("modalDelete");
            if (isNone(DashboardState.deleted)) {
                displayError("No password selected to delete!");
                return;
            }
            handlePasswordDelete(DashboardState.deleted);
        });
        $modalDeleteCancelBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            hideModal("modalDelete");
        });

        const $errorModal = document.getElementById("modalError");
        $errorModal.onclick = (ev) => {
            shouldCloseOrNot("modalError", ev);
        }
        const $modalErrorBtn = document.querySelector(".modal-error-btn");
        $modalErrorBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            hideModal("modalError");
        });

        const $addPasswordBtn = document.getElementById("generateNewPass");
        $addPasswordBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            cycleGeneratedPassword("modalAdd");
            showModal("modalAdd");
        });

        const $btnRegenPass = document.getElementById("btnRegenPass");
        $btnRegenPass.addEventListener("click", (ev) => {
            ev.preventDefault();
            cycleGeneratedPassword("modalAdd");
        });

        const $checkLower = document.querySelector("#modalAdd input[name='genPassLower']");
        const $checkUpper = document.querySelector("#modalAdd input[name='genPassUpper']");
        const $checkNum = document.querySelector("#modalAdd input[name='genPassNum']");
        const $checkSym = document.querySelector("#modalAdd input[name='genPassSym']");
        const $checkLength = document.querySelector("#modalAdd input[name='genPassLength']");
        const cyclePass = (ev) => {
            ev.preventDefault();
            cycleGeneratedPassword("modalAdd");
        }
        $checkLower.addEventListener("change", cyclePass);
        $checkUpper.addEventListener("change", cyclePass);
        $checkNum.addEventListener("change", cyclePass);
        $checkSym.addEventListener("change", cyclePass);
        $checkLength.addEventListener("change", cyclePass);

        const $btnRegenPassEdit = document.getElementById("btnRegenPassEdit");
        $btnRegenPassEdit.addEventListener("click", (ev) => {
            ev.preventDefault();
            cycleGeneratedPassword("modalEdit");
        });
        const $checkLowerEd = document.querySelector("#modalEdit input[name='genPassLower']");
        const $checkUpperEd = document.querySelector("#modalEdit input[name='genPassUpper']");
        const $checkNumEd = document.querySelector("#modalEdit input[name='genPassNum']");
        const $checkSymEd = document.querySelector("#modalEdit input[name='genPassSym']");
        const $checkLengthEd = document.querySelector("#modalEdit input[name='genPassLength']");
        const cyclePassEdit = (ev) => {
            ev.preventDefault();
            cycleGeneratedPassword("modalEdit");
        }
        $checkLowerEd.addEventListener("change", cyclePassEdit);
        $checkUpperEd.addEventListener("change", cyclePassEdit);
        $checkNumEd.addEventListener("change", cyclePassEdit);
        $checkSymEd.addEventListener("change", cyclePassEdit);
        $checkLengthEd.addEventListener("change", cyclePassEdit);

        const $addModal = document.getElementById("modalAdd");
        $addModal.onclick = (ev) => {
            shouldCloseOrNot("modalAdd", ev);
        }
        const $modalAddBtn = document.querySelector(".modal-add-btn");
        $modalAddBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            DashboardState.modalLock.modalAdd = true;
            const $email = document.getElementById("emailBoxAdd");
            const $password = document.getElementById("genPasswordValue");
            const email = $email.value;
            const innerPass = $password.innerText;

            if (isEmpty(email)) {
                alert("Email cannot be empty!");
                DashboardState.modalLock.modalAdd = false;
                return;
            };
            if (isEmpty(innerPass)) {
                alert("Password cannot be empty!");
                DashboardState.modalLock.modalAdd = false;
                return;
            }

            $modalAddBtn.setAttribute("disabled", "disabled");
            $btnRegenPass.setAttribute("disabled", "disabled");
            $email.setAttribute("disabled", "disabled");
            $password.setAttribute("disabled", "disabled");
            disablePasswordModifierCheckbox("modalAdd");

            SENDJson("POST", "/api/passwords", {
                email: email,
                password: innerPass
            }).then((resp) => resp.json()).then((data) => {
                DashboardState.modalLock.modalAdd = false;
                $modalAddBtn.removeAttribute("disabled");
                $btnRegenPass.removeAttribute("disabled");
                $email.removeAttribute("disabled");
                $password.removeAttribute("disabled");
                enablePasswordModifierCheckbox("modalAdd");
                if (data.success) {
                    const $tr = generateTableRow(data.data.id, email, innerPass);
                    $tableBody.appendChild($tr);
                    hideModal("modalAdd");
                } else {
                    hideModal("modalAdd");
                    displayError(data.error);
                }
            });
        });
        const $modalAddBtnCancel = document.querySelector(".modal-add-cancel-btn");
        $modalAddBtnCancel.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (!DashboardState.modalLock.modalAdd) {
                hideModal("modalAdd");
            }
        });

        const $editModal = document.getElementById("modalEdit");
        $editModal.onclick = (ev) => {
            shouldCloseOrNot("modalEdit", ev);
        }
        const $modalEditBtnCancel = document.querySelector(".modal-edit-cancel-btn");
        $modalEditBtnCancel.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (!DashboardState.modalLock.modalEdit) {
                hideModal("modalEdit");
            }
        });
        const $modalEditBtn = document.querySelector(".modal-edit-btn");
        $modalEditBtn.addEventListener("click", (ev) => {
            ev.preventDefault();
            DashboardState.modalLock.modalEdit = true;
            const $email = document.getElementById("emailBoxEdit");
            const $password = document.getElementById("genPasswordValueEdit");
            const email = $email.value;
            const innerPass = $password.value;

            if (isEmpty(email)) {
                alert("Email cannot be empty!");
                DashboardState.modalLock.modalEdit = false;
                return;
            };
            if (isEmpty(innerPass)) {
                alert("Password cannot be empty!");
                DashboardState.modalLock.modalEdit = false;
                return;
            }

            $modalEditBtn.setAttribute("disabled", "disabled");
            $email.setAttribute("disabled", "disabled");
            $password.setAttribute("disabled", "disabled");
            $btnRegenPassEdit.setAttribute("disabled", "disabled");
            disablePasswordModifierCheckbox("modalEdit");

            SENDJson("PUT", "/api/passwords", {
                id: DashboardState.editing,
                email: email,
                password: innerPass
            }).then((resp) => resp.json()).then((data) => {
                DashboardState.modalLock.modalEdit = false;
                $modalEditBtn.removeAttribute("disabled");
                $btnRegenPassEdit.removeAttribute("disabled");
                $email.removeAttribute("disabled");
                $password.removeAttribute("disabled");
                enablePasswordModifierCheckbox("modalEdit");
                DashboardState.editing = null;
                if (data.success) {
                    const $tr = generateTableRow(data.data.id, email, innerPass);
                    $tableBody.replaceChild($tr, document.querySelector(`tr[data-password-id="${data.data.id}"]`));
                    hideModal("modalEdit");
                } else {
                    hideModal("modalEdit");
                    displayError(data.error);
                }
            });
        });

        document.getElementById("logOutBtn").addEventListener("click", (ev) => {
            ev.preventDefault();
            SENDJson("POST", "/api/logout").then((resp) => resp.json()).then((d) => {
                if (d.success) {
                    window.location.href = "/";
                } else {
                    displayError("Unable to log out from server!");
                }
            })
        });
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