const productImagesContainerEl = document.getElementById("product-images");
const productImages = productImagesContainerEl.getElementsByTagName("img");
const imageNumberEl = document.getElementById("image-number");

const imageForwardsEl = document.getElementById("product-forwards");
const imageBackwardsEl = document.getElementById("product-backwards");

let activeImage = 0;
const imageNum = 7;

function updateActiveImage() {
    if (activeImage < 0) {
        activeImage = imageNum;
    } else if (activeImage > imageNum - 1) {
        activeImage = 0;
    }

    for (image of productImages) {
        image.classList.remove("active");
    }

    for (dot of imageNumberEl.children) {
        dot.classList.remove("active");
    }

    productImagesContainerEl.children[activeImage].classList.add("active");
    imageNumberEl.children[activeImage].classList.add("active");
}

updateActiveImage();

imageForwardsEl.addEventListener("click", (event) => {
    activeImage += 1;

    updateActiveImage();
});

imageBackwardsEl.addEventListener("click", (event) => {
    activeImage -= 1;

    updateActiveImage();
});