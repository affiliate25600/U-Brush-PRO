// Scroll animations

window.screenHeightScrollPercent = 0

window.addEventListener("scroll", setScrollVar);
window.addEventListener("resize", setScrollVar);

function setScrollVar() {
    const htmlEl = document.documentElement;
    screenHeightScrollPercent = htmlEl.scrollTop / htmlEl.clientHeight;

    htmlEl.style.setProperty("--scroll", screenHeightScrollPercent * 100);

    if (window.animate && screenHeightScrollPercent < 0.35) {
        window.animate();
    }
}

setScrollVar();

// On scroll animations

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        console.log(entry)
        if (entry.isIntersecting) {
            entry.target.classList.add("show");
        } else {
            entry.target.classList.remove("show");
        }
    });
});

const hiddenElements = document.querySelectorAll('.hidden');
hiddenElements.forEach((el) => observer.observe (el));

// Cursor

const cursor = document.getElementById("cursor");

document.addEventListener("mousemove", (event) => {
    const {clientX, clientY} = event;

    cursor.animate({
        left: `${clientX}px`,
        top: `${clientY}px`
    }, {duration: 3000, fill: "forwards"});
});