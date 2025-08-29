
const surahSelect = document.getElementById("surah");
const form = document.getElementById("quranForm");
const verseContainer = document.getElementById("verseContainer");
const arabicText = document.getElementById("arabicText");
const translationText = document.getElementById("translationText");
const ayahAudio = document.getElementById("ayahAudio");
const reciteBtn = document.getElementById("reciteBtn");
const stopReciteBtn = document.getElementById("stopReciteBtn");
const resultDiv = document.getElementById("result");
const submitForm = document.getElementById("submitForm");

let currentSurah = null;
let currentAyah = null;

// Fetch Surah list
fetch("https://quranapi.pages.dev/api/surah.json")
    .then(res => res.json())
    .then(data => {
        data.forEach((s, index) => {
            let opt = document.createElement("option");
            opt.value = index + 1;
            opt.textContent = `${index + 1} (${s.surahName}) - Ayahs: ${s.totalAyah}`;
            opt.setAttribute("data-ayahs", s.totalAyah);
            surahSelect.appendChild(opt);
        });
    });

// Handle form submit
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    currentSurah = surahSelect.value;
    console.log(currentSurah);
    let ayahCount = surahSelect.options[surahSelect.selectedIndex].getAttribute("data-ayahs");
    let randomAyah = Math.floor(Math.random() * ayahCount) + 1;
    currentAyah = randomAyah;

    let response = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${currentAyah}.json`);
    let data = await response.json();

    arabicText.textContent = data.arabic1;
    translationText.textContent = data.english ;
    ayahAudio.src = data.audio[4].url;

    verseContainer.style.display = "block";
    resultDiv.textContent = "";
});

// Recite Next Ayah
reciteBtn.addEventListener("click", async () => {
    console.log("Recite clicked");
    let nextAyahNo = parseInt(currentAyah) + 1;
    let res = await fetch(`https://quranapi.pages.dev/api/${currentSurah}/${nextAyahNo}.json`);
    let nextAyahData = await res.json();
    // If arabic 1 is used, it utilizes harakats as well. 
    // However, for speech recognition, arabic 2 might be clearer. but doesnot consider harakats
    let correctText = String(nextAyahData.arabic2);

    resultDiv.textContent = "Listening... Speak now.";
    reciteBtn.style.display = "none";
    stopReciteBtn.style.display = "inline";

    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Speech Recognition not supported in your browser.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA"; // Arabic
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

        recognition.onresult = (event) => {
                let userText = String(event.results[0][0].transcript);
                console.log("User said: ", userText);
                // Simple text similarity
                let match = similarity(userText, correctText) * 100;
                resultDiv.innerHTML = `
                    <div class="result-block userrecite"><b>User Recited:</b><br>${userText}</div>
                    <div class="result-block correct"><b>Correct Ayah:</b><br>${correctText}</div>
                    <div class="result-block score">Score: ${match.toFixed(2)}%</div>
                `;

                reciteBtn.style.display = "inline";
                stopReciteBtn.style.display = "none";
        };

    recognition.onerror = (e) => {
        resultDiv.textContent = "Error: " + e.error;
        reciteBtn.style.display = "inline";
        stopReciteBtn.style.display = "none";
    };

    stopReciteBtn.onclick = () => recognition.stop();
});

// Function to calculate similarity (Levenshtein ratio approximation)
function similarity(s1, s2) {
    let longer = s1.length > s2.length ? s1 : s2;
    let shorter = s1.length > s2.length ? s2 : s1;
    let longerLength = longer.length;
    if (longerLength === 0) return 1.0;
    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
}

function editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = [];
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i === 0)
                costs[j] = j;
            else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                        newValue = Math.min(Math.min(newValue, lastValue),
                            costs[j]) + 1;
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0)
            costs[s2.length] = lastValue;
    }
    return costs[s2.length];
}

