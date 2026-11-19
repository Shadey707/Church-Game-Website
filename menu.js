const btn = document.querySelector(".menu-btn");
const nav = document.querySelector("nav");


btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen);
});


document.addEventListener("click", (event) => {
    if (!nav.contains(event.target) && !btn.contains(event.target)) {
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded", false);
    }
});




