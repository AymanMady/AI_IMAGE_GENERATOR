const themeToggle = document.querySelector(".theme-toggle");    
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");


const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
  ];
  
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPerfersDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;

    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPerfersDarkTheme);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})
// Switch between light and dark theme
themeToggle.addEventListener("click", () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
});



promptBtn.addEventListener("click", () => {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = randomPrompt;
    promptInput.focus();
});

const getImageDimensions = (ratio, baseSize = 512) => {
    const [width, height] = ratio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
    calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

    return {
        width: calculatedWidth,
        height: calculatedHeight
    }
}

const updateImage = (index, imgUrl) => {
    const imageCard = document.getElementById(`img-card-${index}`);

    if (!imageCard) return;

    imageCard.classList.remove("loading");
    imageCard.innerHTML = `
                        <img src="${imgUrl}" class="result-img" alt="">
                        <div class="img-overlay">
                            <a href="${imgUrl}"class="img-download-btn" dwonload="${Date.now()}.png">
                                <i class="fa-solid fa-download"></i>
                            </a>
                        </div>
    `
} 

const generateImages = async (model, count, ratio, prompt) => {
    const Model_URL = `https://router.huggingface.co/hf-inference/models/${model}`;
    const { width, height } = getImageDimensions(ratio);

    console.log(width, height);
    const imagePromises = Array.from({ length: count }, async (_, i) => {
        try {
            const response = await fetch(Model_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json",
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        width,
                        height
                    },
                    options: { 
                        wait_for_model: true,
                        user_cache: false 
                    }
                }),
            });

            if (!response.ok) {
                throw new Error((await response.json()).error);
            }
            const result = await response.blob();
            updateImage(i, URL.createObjectURL(result));
        } catch (error) {
            console.log(error);
        }
    });

    return Promise.allSettled(imagePromises);
};


// Create image cards
const createImageCards = (model, count, ratio, prompt) => {
    gridGallery.innerHTML = "";
    for (let i = 0; i < count; i++) {
        gridGallery.innerHTML += `
                    <div class="img-card" id="img-card-${i}" style="aspect-ratio: ${ratio}">
                        <div class="status-container">
                            <div class="spinner"></div>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <p class="status-text">Generating...</p>
                        </div>
                    </div>
                `;
    }

    generateImages(model, count, ratio, prompt);
}

// Handle form submission
promptForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // Get form values
    const selectedModel = modelSelect.value;
    const selectedCount = parseInt(countSelect.value) || 1;
    const selectedRatio = ratioSelect.value || "1/1";
    const promptText = promptInput.value.trim();

    createImageCards(selectedModel, selectedCount, selectedRatio, promptText);
});

