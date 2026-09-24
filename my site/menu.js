const menuButton = document.querySelector(".menu-button");
const navbar = document.querySelector(".navbar");

menuButton.addEventListener("click", () => {

    navbar.classList.toggle("active");

});