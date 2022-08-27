/**
 * Generate random password
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

    let password = "";
    let characters = "";

    if (lowerLetter) characters += lowerCase;
    if (capitalLetter) characters += upperCase;
    if (number) characters += numbers;
    if (symbol) characters += symbols;

    if (characters.length === 0) return "";

    for (let i = 0; i < length; i++) {
        password += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return password;
} // <-- the reason it is not in the below safeguard is because I want to test it from the browser console itself.

// safeguard, make sure the js content and function cannot be acessed by the browser
(function() {
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
    
    /* <tr class="border-b-[1px] border-gray-500">
    <td class="text-center p-2">sample@mail.com</td>
    <td class="p-2 blur-md hover:blur-none transition text-center">samplepassword</td>
    <td class="p-2 py-4">
        <div class="flex flex-col justify-center gap-2">
            <button class="bg-teal-400 hover:bg-teal-500 transition mx-auto px-4 py-1 rounded-md text-sm uppercase font-semibold">Edit</button>
            <button class="bg-red-400 hover:bg-red-500 transition mx-auto px-4 py-1 rounded-md text-sm uppercase font-semibold">Delete</button>
        </div>
    </td>
    </tr> */
    
    /**
     * Handle password editing
     * @param {number} passwordId the password id
     */
    function handlePasswordEdit(passwordId) {
        // do stuff here
        console.info("[Edit]", passwordId);
    }
    
    /**
     * Handle password deletion
     * @param {number} passwordId the password id
     */
     function handlePasswordDelete(passwordId) {
        // do stuff here
        const $tr = document.querySelector(`tr[data-password-id="${passwordId}"]`);
        const $btnDelete = $tr.querySelector("button[data-button-type='delete']");
        $btnDelete.setAttribute("disabled", "disabled");
        console.info("[Delete]", passwordId);
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
    
    function showModal(modalId) {
        const $modal = document.getElementById(modalId);
        $modal.classList.remove("hidden");
    }
    
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
        const $tr = document.createElement("tr");
        $tr.classList.add("border-b-[1px]", "border-gray-500");
    
        const $tdEmail = document.createElement("td");
        $tdEmail.classList.add("text-center", "p-2");
        $tdEmail.innerText = email;
    
        const $tdPassword = document.createElement("td");
        $tdPassword.classList.add("p-2", "text-center");
    
        const $innerPassword = document.createElement("span");
        $innerPassword.classList.add("blur-md", "hover:blur-none", "transition", "select-all");
        $innerPassword.innerText = password;
        $tdPassword.appendChild($innerPassword);
    
        const $tdActions = document.createElement("td");
        $tdActions.classList.add("p-2", "py-4");
        const $divActionsInner = document.createElement("div");
        $divActionsInner.classList.add("flex", "flex-col", "justify-center", "gap-2");
    
        const $buttonEdit = document.createElement("button");
        $buttonEdit.classList.add("bg-teal-400", "hover:bg-teal-500", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold", "select-none");
        $buttonEdit.innerText = "Edit";
        $buttonEdit.addEventListener("click", () => {
            DashboardState.editing = passwordId;
            document.getElementById("genPasswordValueEdit").value = password;
            const $checkLower = document.querySelector(`#modalEdit input[name='genPassLower']`);
            const $checkUpper = document.querySelector(`#modalEdit input[name='genPassUpper']`);
            const $checkNum = document.querySelector(`#modalEdit input[name='genPassNum']`);
            const $checkSym = document.querySelector(`#modalEdit input[name='genPassSym']`);
            const $checkLength = document.querySelector(`#modalEdit input[name='genPassLength']`);
            $checkLower.checked = hasAnyLowercase(password);
            $checkUpper.checked = hasAnyUppercase(password);
            $checkNum.checked = hasAnyNumber(password);
            $checkSym.checked = hasAnySymbol(password);
            $checkLength.value = password.length.toString();
            document.getElementById("emailBoxEdit").value = email;
            showModal("modalEdit");
        });
        $buttonEdit.setAttribute("data-password-id", passwordId.toString());
        $buttonEdit.setAttribute("data-button-type", "edit");
    
        const $buttonDelete = document.createElement("button");
        $buttonDelete.classList.add("bg-red-400", "hover:bg-red-500", "disabled:bg-red-500", "disabled:cursor-not-allowed", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold", "select-none");
        $buttonDelete.innerText = "Delete";
        $buttonDelete.addEventListener("click", () => {
            console.info("[Delete]", passwordId);
            DashboardState.deleted = passwordId;
            showModal("modalDelete");
        });
        $buttonDelete.setAttribute("data-password-id", passwordId.toString());
        $buttonDelete.setAttribute("data-button-type", "delete");
    
        $divActionsInner.appendChild($buttonEdit);
        $divActionsInner.appendChild($buttonDelete);
        $tdActions.appendChild($divActionsInner);
        $tr.appendChild($tdEmail);
        $tr.appendChild($tdPassword);
        $tr.appendChild($tdActions);
        $tr.setAttribute("data-password-id", passwordId.toString());
        return $tr;
    }

    function isAllGenModifierOff(prefix) {
        const $checkLower = document.querySelector(`#${prefix} input[name='genPassLower']`);
        const $checkUpper = document.querySelector(`#${prefix} input[name='genPassUpper']`);
        const $checkNum = document.querySelector(`#${prefix} input[name='genPassNum']`);
        const $checkSym = document.querySelector(`#${prefix} input[name='genPassSym']`);

        return !$checkLower.checked && !$checkUpper.checked && !$checkNum.checked && !$checkSym.checked;
    }

    function enablePassModBtn(prefix) {
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

    function disablePassModBtn(prefix) {
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

    function displayError(message) {
        const $modalErrorTextView = document.getElementById("modalErrorTextView");
        $modalErrorTextView.innerText = message;
        showModal("modalError");
    }

    function hasAnyUppercase(str) {
        return str.toLowerCase() !== str;
    }

    function hasAnyLowercase(str) {
        return str.toUpperCase() !== str;
    }

    function hasAnyNumber(str) {
        return /\d/.test(str);
    }

    function hasAnySymbol(str) {
        return /[^a-zA-Z\d]/.test(str);
    }

    /**
     * Regenerate password and put it in the modal
     * @param {string} prefix the modal prefix thingamic
     */
    function cycleGeneratedPassword(prefix) {
        const extraText = prefix.includes("Edit") ? "Edit" : "";
        const $btnRegenPass = document.getElementById("btnRegenPass" + extraText);
        const $checkLength = document.querySelector(`#${prefix} input[name='genPassLength']`);
        console.info($checkLength, prefix);
        const isAllOff = isAllGenModifierOff(prefix);
        if (isAllOff) {
            $btnRegenPass.setAttribute("disabled", "true");
            $checkLength.setAttribute("disabled", "true");
            return;
        } else {
            $btnRegenPass.removeAttribute("disabled");
            $checkLength.removeAttribute("disabled");
        }
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

    function main() {
        // do main stuff here
        const $tableBody = document.getElementById("passwordView");
        GETJson("/api/passwords").then((data) => {
            data.data.forEach((pwd) => {
                const $tr = generateTableRow(pwd.id, pwd.email, pwd.password);
                $tableBody.appendChild($tr);
            })
        })
    
        // modal
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
            enablePassModBtn("modalAdd");

            SENDJson("POST", "/api/passwords", {
                email: email,
                password: innerPass
            }).then((resp) => resp.json()).then((data) => {
                DashboardState.modalLock.modalAdd = false;
                $modalAddBtn.removeAttribute("disabled");
                $btnRegenPass.removeAttribute("disabled");
                $email.removeAttribute("disabled");
                $password.removeAttribute("disabled");
                disablePassModBtn("modalAdd");
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
            enablePassModBtn("modalEdit");

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
                disablePassModBtn("modalEdit");
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
    
    if (document.readyState === "complete") {
        main();
    } else {
        document.addEventListener("DOMContentLoaded", main);
    }
})();