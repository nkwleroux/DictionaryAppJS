const btnBack = document.querySelector("#btnBack");
const txtEmail = document.querySelector('#txtEmail')
const txtPassword = document.querySelector('#txtPassword')
const btnLogin = document.querySelector('#btnLogin')
const btnSignup = document.querySelector('#btnSignup')
const divLoginError = document.querySelector('#divLoginError')
const lblLoginErrorMessage = document.querySelector('#lblLoginErrorMessage')
const lableEmail = document.querySelector('#lableEmail')
const lablePassword = document.querySelector('#lablePassword')

document.addEventListener("DOMContentLoaded", () => {
    txtEmail.value = "";
    txtPassword.value = "";
    hideLoginError(); 
});

function btnInputFieldEvent(input, label,text){
    label.innerHTML = '';
    btnLogin.disabled = false;

    if (input.value.length == 0) {
        btnLogin.disabled = true;
        label.innerHTML = text;
    }
}

txtEmail.addEventListener('change', () => {
    btnInputFieldEvent(txtEmail, lableEmail, 'Email')
});

txtEmail.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        txtPassword.focus();
    }

    btnInputFieldEvent(txtEmail, lableEmail, 'Email')
});

txtPassword.addEventListener('change', () => {
    btnInputFieldEvent(txtPassword, lablePassword, 'Password');
});

txtPassword.addEventListener('keyup', (event) => {
    if (event.keyCode === 13) {
        event.preventDefault();
        btnLogin.focus();
    }

    btnInputFieldEvent(txtPassword, lablePassword, 'Password')
});

btnBack.addEventListener("click", () => {
    txtEmail.value = "";
    txtPassword.value = "";
    homepage("");
});

function homepage (user) {
    if(user != undefined || user != ""){
        localStorage.setItem("user", [user]);
    }

    document.location.href = "/";
}

function postCredentialRequest(url){

    hideLoginError()

    const email = txtEmail.value;
    const password = txtPassword.value;

    if(email.length == 0 || password.length == 0){
        showLoginError('Please enter email and password');
        return;
    }

    let xmlhttp = new XMLHttpRequest(); // new HttpRequest instance
    xmlhttp.open("POST", url, true);

    // Set the request format
    xmlhttp.setRequestHeader("Accept", "application/json");
    xmlhttp.setRequestHeader("Content-Type", "application/json");

    //When data is recieved from the server
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            console.log(xmlhttp.responseText);
            if(xmlhttp.responseText == email){
                homepage(email);
            }else{
                showLoginError(xmlhttp.responseText);
            }
        }
    };

    const jsonData = {
        email: email,
        password: password
    }

    xmlhttp.send(JSON.stringify(jsonData));

    return xmlhttp;
}

btnLogin.addEventListener("click", async () => {
   postCredentialRequest("/login");
});

btnSignup.addEventListener("click", async () => {
   postCredentialRequest("/signup");
});

const hideLoginError = () => {
  divLoginError.style.display = 'none';
  lblLoginErrorMessage.innerHTML = '';
}

const showLoginError = (error) => {
  divLoginError.style.display = 'block';    
  lblLoginErrorMessage.innerHTML = `Error: ${error}`;    
}

