function GETJson(url) {
    return fetch(url, {
        method: "GET",
        headers: {
            "Accept": "application/json"
        },
    }).then((resp) => resp.json());
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
    console.info("[Delete]", passwordId);
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
    $tdPassword.classList.add("p-2", "blur-md", "hover:blur-none", "transition", "text-center");
    $tdPassword.innerText = password;
    
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

    const $buttonDelete = document.createElement("button");
    $buttonDelete.classList.add("bg-red-400", "hover:bg-red-500", "transition", "mx-auto", "px-4", "py-1", "rounded-md", "text-sm", "uppercase", "font-semibold");
    $buttonDelete.innerText = "Delete";
    $buttonDelete.addEventListener("click", () => {
        handlePasswordDelete(passwordId);
    });
    $divActionsInner.appendChild($buttonEdit);
    $divActionsInner.appendChild($buttonDelete);
    $tdActions.appendChild($divActionsInner);
    $tr.appendChild($tdEmail);
    $tr.appendChild($tdPassword);
    $tr.appendChild($tdActions);
    return $tr;
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
}

if (document.readyState === "complete") {
    document.addEventListener("DOMContentLoaded", main);
} else {
    main();
}