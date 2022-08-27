// safeguard, make sure the js content and function cannot be acessed by the browser
(function() {
    const DashboardState = {
        /** @type {number | null} */
        deleted: null,
        /** @type {string | null} */
        editing: null,
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
    
    function SENDJson(method, url, data) {
        return fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
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
        $btnDelete.classList.remove("bg-red-400", "hover:bg-red-500");
        $btnDelete.classList.add("bg-red-600", "cursor-not-allowed");
        console.info("[Delete]", passwordId);
        SENDJson("DELETE", "/api/passwords", {id: passwordId}).then((resp) => resp.json()).then((data) => {
            $btnDelete.classList.remove("bg-red-600", "cursor-not-allowed");
            $btnDelete.classList.add("bg-red-400", "hover:bg-red-500");
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
        $innerPassword.classList.add("blur-md", "hover:blur-none", "transition", );
        $innerPassword.innerText = password;
        $tdPassword.appendChild($innerPassword);
    
        const $tdActions = document.createElement("td");
        $tdActions.classList.add("p-2", "py-4");
        const $divActionsInner = document.createElement("div");
        $divActionsInner.classList.add("flex", "flex-col", "justify-center", "gap-2");
    
        const $buttonEdit = document.createElement("button");
        $buttonEdit.classList.add("bg-teal-400", "hover:bg-teal-500", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold");
        $buttonEdit.innerText = "Edit";
        $buttonEdit.addEventListener("click", () => {
            handlePasswordEdit(passwordId);
        });
        $buttonEdit.setAttribute("data-password-id", passwordId.toString());
        $buttonEdit.setAttribute("data-button-type", "edit");
    
        const $buttonDelete = document.createElement("button");
        $buttonDelete.classList.add("bg-red-400", "hover:bg-red-500", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold");
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
    
    /**
     * 
     * @param {string} modalId Modal ID
     * @param {PointerEvent} ev Event
     */
    function shouldCloseOrNot(modalId, ev) {
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
    }
    
    if (document.readyState === "complete") {
        document.addEventListener("DOMContentLoaded", main);
    } else {
        main();
    }
})();