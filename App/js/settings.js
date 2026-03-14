function loadAccountInfo(){

let user=getCurrentUser();

if(!user) return;

let name=document.getElementById("accountName");
let email=document.getElementById("accountEmail");

if(name) name.innerText="Name: "+user.name;
if(email) email.innerText="Email: "+user.email;

}

function resetUserData(){

let user=getCurrentUser();

if(!user) return;

let confirmReset=confirm("Reset all your stores, transactions and expenses?");

if(!confirmReset) return;

localStorage.removeItem("companies_"+user.email);
localStorage.removeItem("transactions_"+user.email);
localStorage.removeItem("expenses_"+user.email);
localStorage.removeItem("reports_"+user.email);

alert("All data cleared");

}

function deleteAccount(){

let user=getCurrentUser();

if(!user) return;

let confirmDelete=confirm("Delete your account permanently?");

if(!confirmDelete) return;

let users=JSON.parse(localStorage.getItem("khata_users")) || [];

users=users.filter(u=>u.email!==user.email);

localStorage.setItem("khata_users",JSON.stringify(users));

localStorage.removeItem("companies_"+user.email);
localStorage.removeItem("transactions_"+user.email);
localStorage.removeItem("expenses_"+user.email);
localStorage.removeItem("reports_"+user.email);

localStorage.removeItem("currentUser");

alert("Account deleted");

window.location.href="login.html";

}

document.addEventListener("DOMContentLoaded",loadAccountInfo);
