
/* ==========================================
   VOICEBRIDGE AI - JAVASCRIPT
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    // HTML elements
    const languageSelect = document.getElementById("language");

    const startBtn = document.getElementById("startBtn");
    const stopBtn = document.getElementById("stopBtn");
    const speechResult = document.getElementById("speechResult");
    const recordingStatus = document.getElementById("recordingStatus");

    const copySpeechBtn = document.getElementById("copySpeechBtn");
    const clearSpeechBtn = document.getElementById("clearSpeechBtn");

    const textInput = document.getElementById("textInput");
    const voiceSelect = document.getElementById("voiceSelect");
    const speedInput = document.getElementById("speed");
    const speedValue = document.getElementById("speedValue");

    const speakBtn = document.getElementById("speakBtn");
    const pauseBtn = document.getElementById("pauseBtn");
    const resumeBtn = document.getElementById("resumeBtn");
    const stopSpeakBtn = document.getElementById("stopSpeakBtn");

    const speechWordCount = document.getElementById("speechWordCount");
    const speechCharCount = document.getElementById("speechCharCount");
    const inputWordCount = document.getElementById("inputWordCount");
    const inputCharCount = document.getElementById("inputCharCount");

    const toast = document.getElementById("toast");
    const currentYear = document.getElementById("currentYear");

    // Browser capabilities
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    const speechSynthesis = window.speechSynthesis;

    let recognition = null;
    let isListening = false;
    let shouldRestart = false;
    let finalTranscript = "";
    let toastTimer = null;

    // ======================================
    // NOTIFICATIONS
    // ======================================

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // ======================================
    // TEXT COUNTERS
    // ======================================

    function updateCounter(text, wordElement, charElement) {
        const trimmedText = text.trim();

        const words = trimmedText
            ? trimmedText.split(/\s+/).length
            : 0;

        wordElement.textContent =
            `${words} ${words === 1 ? "word" : "words"}`;

        charElement.textContent =
            `${text.length} ${text.length === 1 ? "character" : "characters"}`;
    }

    function updateSpeechCounter() {
        updateCounter(
            speechResult.value,
            speechWordCount,
            speechCharCount
        );
    }

    function updateInputCounter() {
        updateCounter(
            textInput.value,
            inputWordCount,
            inputCharCount
        );
    }

    speechResult.addEventListener("input", updateSpeechCounter);
    textInput.addEventListener("input", updateInputCounter);

    // ======================================
    // LANGUAGE SELECTION
    // ======================================

    function getSelectedLanguage() {
        return languageSelect.value || "en-US";
    }

    languageSelect.addEventListener("change", () => {
        const language = getSelectedLanguage();

        if (recognition && isListening) {
            shouldRestart = false;
            recognition.stop();
        }

        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }

        populateVoices();

        showToast(`Language changed to ${languageSelect.options[
            languageSelect.selectedIndex
        ].text}.`);
    });

    // ======================================
    // VOICE-TO-TEXT SETUP
    // ======================================

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getSelectedLanguage();

        recognition.onstart = () => {
            isListening = true;
            startBtn.classList.add("listening");

            recordingStatus.textContent = "Listening... Speak now!";
            startBtn.setAttribute("aria-label", "Listening to speech");

            startBtn.disabled = false;
            stopBtn.disabled = false;
        };

        recognition.onresult = (event) => {
            let interimTranscript = "";

            for (
                let i = event.resultIndex;
                i < event.results.length;
                i++
            ) {
                const transcript =
                    event.results[i][0].transcript;

                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }

            speechResult.value =
                finalTranscript + interimTranscript;

            updateSpeechCounter();
        };

        recognition.onerror = (event) => {
            const errorMessages = {
                "not-allowed":
                    "Microphone permission denied. Please allow microphone access.",
                "audio-capture":
                    "No microphone was detected. Check your microphone.",
                "network":
                    "Speech recognition network error. Please check your connection.",
                "no-speech":
                    "No speech detected. Try speaking again.",
                "service-not-allowed":
                    "Speech recognition is not permitted in this browser."
            };

            if (event.error === "no-speech") {
                recordingStatus.textContent =
                    "No speech detected. Keep speaking or try again.";
                return;
            }

            if (event.error === "aborted" && !shouldRestart) {
                return;
            }

            const message =
                errorMessages[event.error] ||
                `Speech recognition error: ${event.error}`;

            recordingStatus.textContent = message;
            showToast(message);

            if (
                event.error === "not-allowed" ||
                event.error === "service-not-allowed" ||
                event.error === "audio-capture"
            ) {
                shouldRestart = false;
            }
        };

        recognition.onend = () => {
            isListening = false;
            startBtn.classList.remove("listening");
            startBtn.setAttribute(
                "aria-label",
                "Start voice recognition"
            );

            if (shouldRestart) {
                try {
                    recognition.lang = getSelectedLanguage();
                    recognition.start();
                    return;
                } catch (error) {
                    shouldRestart = false;
                }
            }

            recordingStatus.textContent =
                speechResult.value.trim()
                    ? "Recording stopped. Your transcript is ready."
                    : "Click the microphone to start";

            startBtn.disabled = false;
            stopBtn.disabled = true;
        };

    } else {
        startBtn.disabled = true;
        stopBtn.disabled = true;

        recordingStatus.textContent =
            "Speech recognition is not supported in this browser.";

        showToast(
            "Please use a supported browser, such as Chrome, for voice recognition."
        );
    }

    // ======================================
    // START LISTENING
    // ======================================

    startBtn.addEventListener("click", () => {
        if (!recognition) {
            showToast(
                "Speech recognition is unavailable in this browser."
            );
            return;
        }

        if (isListening) {
            showToast("Already listening. Please speak.");
            return;
        }

        finalTranscript = speechResult.value.trim();

        if (finalTranscript) {
            finalTranscript += " ";
        }

        shouldRestart = true;
        recognition.lang = getSelectedLanguage();

        try {
            recognition.start();
        } catch (error) {
            shouldRestart = false;
            showToast(
                "Could not start the microphone. Please try again."
            );
        }
    });

    // ======================================
    // STOP LISTENING
    // ======================================

    stopBtn.disabled = true;

    stopBtn.addEventListener("click", () => {
        if (recognition && isListening) {
            shouldRestart = false;
            recognition.stop();

            recordingStatus.textContent = "Stopping microphone...";
        }
    });

    // ======================================
    // COPY TRANSCRIPT
    // ======================================

    async function copyText(text) {
        if (!text.trim()) {
            showToast("There is no text to copy.");
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            showToast("Text copied successfully!");
        } catch (error) {
            // Fallback for browsers without clipboard permission
            const temporaryTextarea =
                document.createElement("textarea");

            temporaryTextarea.value = text;
            temporaryTextarea.style.position = "fixed";
            temporaryTextarea.style.opacity = "0";

            document.body.appendChild(temporaryTextarea);
            temporaryTextarea.select();

            const copied = document.execCommand("copy");

            temporaryTextarea.remove();

            if (copied) {
                showToast("Text copied successfully!");
            } else {
                showToast("Copy failed. Please select and copy the text.");
            }
        }
    }

    copySpeechBtn.addEventListener("click", () => {
        copyText(speechResult.value);
    });

    // ======================================
    // CLEAR TRANSCRIPT
    // ======================================

    clearSpeechBtn.addEventListener("click", () => {
        if (recognition && isListening) {
            shouldRestart = false;
            recognition.stop();
        }

        finalTranscript = "";
        speechResult.value = "";

        updateSpeechCounter();

        recordingStatus.textContent =
            "Click the microphone to start";

        showToast("Transcript cleared.");
    });

    // ======================================
    // TEXT-TO-SPEECH VOICE LIST
    // ======================================

    let availableVoices = [];

    function populateVoices() {
        if (!speechSynthesis) {
            return;
        }

        availableVoices = speechSynthesis.getVoices();

        const previousVoice = voiceSelect.value;
        const selectedLanguage = getSelectedLanguage();

        voiceSelect.innerHTML = "";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Default device voice";

        voiceSelect.appendChild(defaultOption);

        const matchingVoices = availableVoices.filter((voice) =>
            voice.lang.toLowerCase().startsWith(
                selectedLanguage.split("-")[0].toLowerCase()
            )
        );

        const otherVoices = availableVoices.filter((voice) =>
            !matchingVoices.includes(voice)
        );

        const voicesToDisplay = [
            ...matchingVoices,
            ...otherVoices
        ];

        voicesToDisplay.forEach((voice) => {
            const option = document.createElement("option");

            option.value = String(
                availableVoices.indexOf(voice)
            );

            option.textContent =
                `${voice.name} (${voice.lang})`;

            voiceSelect.appendChild(option);
        });

        if (
            previousVoice &&
            Array.from(voiceSelect.options).some(
                (option) => option.value === previousVoice
            )
        ) {
            voiceSelect.value = previousVoice;
        }
    }

    if (speechSynthesis) {
        populateVoices();

        if (typeof speechSynthesis.onvoiceschanged !== "undefined") {
            speechSynthesis.onvoiceschanged = populateVoices;
        }
    } else {
        speakBtn.disabled = true;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
        stopSpeakBtn.disabled = true;

        showToast(
            "Text-to-speech is not supported in this browser."
        );
    }

    // ======================================
    // PLAY TEXT-TO-SPEECH
    // ======================================

    function speakText() {
        const text = textInput.value.trim();

        if (!text) {
            showToast("Please enter some text to read aloud.");
            textInput.focus();
            return;
        }

        if (!speechSynthesis) {
            showToast("Text-to-speech is unavailable.");
            return;
        }

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        utterance.lang = getSelectedLanguage();
        utterance.rate = Number(speedInput.value);
        utterance.pitch = 1;
        utterance.volume = 1;

        const selectedVoiceIndex = voiceSelect.value;

        if (selectedVoiceIndex !== "") {
            const selectedVoice =
                availableVoices[Number(selectedVoiceIndex)];

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        }

        utterance.onstart = () => {
            showToast("Playing your text...");
        };

        utterance.onend = () => {
            showToast("Finished reading your text.");
        };

        utterance.onerror = (event) => {
            if (event.error !== "canceled" &&
                event.error !== "interrupted") {
                showToast(
                    "Unable to play speech. Try another voice."
                );
            }
        };

        speechSynthesis.speak(utterance);
    }

    speakBtn.addEventListener("click", speakText);

    // ======================================
    // PAUSE SPEECH
    // ======================================

    pauseBtn.addEventListener("click", () => {
        if (speechSynthesis && speechSynthesis.speaking) {
            speechSynthesis.pause();
            showToast("Speech paused.");
        } else {
            showToast("No speech is currently playing.");
        }
    });

    // ======================================
    // RESUME SPEECH
    // ======================================

    resumeBtn.addEventListener("click", () => {
        if (speechSynthesis && speechSynthesis.paused) {
            speechSynthesis.resume();
            showToast("Speech resumed.");
        } else {
            showToast("There is no paused speech to resume.");
        }
    });

    // ======================================
    // STOP TEXT-TO-SPEECH
    // ======================================

    stopSpeakBtn.addEventListener("click", () => {
        if (speechSynthesis) {
            speechSynthesis.cancel();
            showToast("Speech stopped.");
        }
    });

    // ======================================
    // PLAYBACK SPEED
    // ======================================

    speedInput.addEventListener("input", () => {
        speedValue.textContent =
            `${Number(speedInput.value).toFixed(1).replace(/\.0$/, "")}x`;
    });

    // ======================================
    // FOOTER YEAR
    // ======================================

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    // ======================================
    // INITIAL COUNTERS
    // ======================================

    updateSpeechCounter();
    updateInputCounter();

    // ======================================
    // INITIAL BUTTON STATES
    // ======================================

    stopBtn.disabled = true;

    console.log("VoiceBridge AI initialized successfully.");
});

