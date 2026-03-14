/* ===============================
KHATA Landing Page Script
Modern SaaS UI Interactions
================================ */


/* ===============================
1. Page Load Check
================================ */

document.addEventListener("DOMContentLoaded", () => {
console.log("KHATA Landing Page Loaded 🚀");
});


/* ===============================
2. Smooth Scroll Navigation
================================ */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

anchor.addEventListener("click", function(e){

e.preventDefault();

const target = document.querySelector(this.getAttribute("href"));

if(target){
target.scrollIntoView({
behavior: "smooth",
block: "start"
});
}

});

});


/* ===============================
3. Navbar Scroll Effect
================================ */

const navbar = document.querySelector("nav");

window.addEventListener("scroll", () => {

if(window.scrollY > 60){

navbar.style.background = "rgba(5,7,13,0.95)";
navbar.style.boxShadow = "0 10px 40px rgba(0,0,0,0.4)";

}else{

navbar.style.background = "rgba(5,7,13,0.7)";
navbar.style.boxShadow = "none";

}

});


/* ===============================
4. Button Ripple Effect
================================ */

document.querySelectorAll(".btn").forEach(button => {

button.addEventListener("click", function(e){

const ripple = document.createElement("span");

const rect = button.getBoundingClientRect();

const size = Math.max(rect.width, rect.height);

ripple.style.width = ripple.style.height = size + "px";

ripple.style.left = e.clientX - rect.left - size/2 + "px";
ripple.style.top = e.clientY - rect.top - size/2 + "px";

ripple.classList.add("ripple");

button.appendChild(ripple);

setTimeout(() => {
ripple.remove();
}, 600);

});

});


/* ===============================
5. Feature Card Hover Interaction
================================ */

const cards = document.querySelectorAll(".feature-card");

cards.forEach(card => {

card.addEventListener("mouseenter", () => {

card.style.transform = "translateY(-12px) scale(1.03)";
card.style.boxShadow = "0 20px 60px rgba(79,127,255,0.3)";

});

card.addEventListener("mouseleave", () => {

card.style.transform = "translateY(0) scale(1)";
card.style.boxShadow = "none";

});

});


/* ===============================
6. Scroll Reveal Animation
================================ */

const revealElements = document.querySelectorAll(
".feature-card, .pricing-card, .step"
);

const observer = new IntersectionObserver((entries)=>{

entries.forEach(entry => {

if(entry.isIntersecting){

entry.target.style.opacity = "1";
entry.target.style.transform = "translateY(0)";
}

});

},{
threshold:0.2
});

revealElements.forEach(el => {

el.style.opacity = "0";
el.style.transform = "translateY(40px)";
el.style.transition = "all 0.8s ease";

observer.observe(el);

});


/* ===============================
7. Pricing Card Glow Animation
================================ */

const pricingCards = document.querySelectorAll(".pricing-card");

pricingCards.forEach(card => {

card.addEventListener("mouseenter", () => {

card.style.boxShadow =
"0 20px 80px rgba(79,127,255,0.4)";

});

card.addEventListener("mouseleave", () => {

card.style.boxShadow = "none";

});

});


/* ===============================
8. CTA Button Interaction
================================ */

const ctaButton = document.querySelector(".cta .btn");

if(ctaButton){

ctaButton.addEventListener("click", () => {

alert("KHATA signup coming soon 🚀");

});

}