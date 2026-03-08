// --- PRELOADER LOGIC ---
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    setTimeout(() => {
        preloader.style.opacity = '0';
        preloader.style.visibility = 'hidden';
        // Initial Router Check on Load
        handleHashRouting(); 
    }, 800); 
});

// --- Core App Logic & Configuration ---
let currentSubject = '';
const sambaNovaApiKey = 'ac767249-e5b3-4069-8f37-437c1b23186a';  

const firebaseConfig = {
    apiKey: "AIzaSyBCaekDGFEkMf4PZEXV2bRAGiDQFtjkpAE",
    authDomain: "edumate-a1a96.firebaseapp.com",
    databaseURL: "https://edumate-a1a96-default-rtdb.firebaseio.com",
    projectId: "edumate-a1a96",
    storageBucket: "edumate-a1a96.firebasestorage.app",
    messagingSenderId: "698102853188",
    appId: "1:698102853188:web:636240dced5fb12cea9611"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const mainContent = document.getElementById('mainContent');
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const questionInput = document.getElementById('questionInput');

const restrictedNames = ["shakeel", "sfmsri", "shakeel raja", "naik", "shakeel ahmed", "naveed malik", "rohit javeed", "arfat aiyub", "arfat malik", "arfat", "roziya farooq", "sehra"];
const vipNames = ["rabia sarwar", "jaffer", "jfrrr", "ahatsham", "sohail bashir", "anayat", "sunail kumar dubey", "zaffer"];

/* =========================================================
   ROUTER CONFIGURATION
========================================================= */
// Map generic hashes to functions
const ROUTES = {
    "#blog": () => openBlogModal(null, true), // true = fromHash
    "#about": () => openAbout(true),
    "#community": () => openCommunity(true),
    "#changeuser": () => { openMenu(); /* specific logic for change user handled in logout */ },
    "#pro": () => openProModal(true),
    "#timer": () => openFocusTimer(true),
    "#about/developer": () => openDeveloperModal(true)
};

function handleHashRouting() {
    const hash = window.location.hash;
    if (!hash) {
        closeAllModals(false); // Close all if no hash
        return;
    }

    // 1. Handle dynamic blog posts with random text IDs (#blog-NjXy828)
    if (hash.startsWith('#blog-')) {
        const postId = hash.replace('#blog-', '');
        if (postId) {
            openBlogModal(postId, true);
            return;
        }
    }
    
    // 2. Handle mapped routes
    if (ROUTES[hash]) {
        ROUTES[hash]();
    }
}

// Listen for hash changes (Back/Forward navigation)
window.addEventListener("hashchange", handleHashRouting);

/* =========================================================
   APP INITIALIZATION
========================================================= */
document.addEventListener("DOMContentLoaded", function () {
    const savedNameForPreload = localStorage.getItem("username");
    if (savedNameForPreload) {
        document.getElementById("chatSubjectTitle").innerText = `Welcome, ${savedNameForPreload}!`;
    }
    loadProfile();

    const splashContainer = document.getElementById("splash-screen-container");
    const splashScreen = document.getElementById("affanoiSplashScreen");

    splashScreen.classList.add("show");

    setTimeout(() => {
        splashContainer.style.display = 'none';
        initApp(); 
    }, 3000); 
});

function initApp() {
    let savedName = localStorage.getItem("username");
    if (!savedName) {
        document.getElementById("nameModal").style.display = "flex";
        updateBlur(); 
    }
    
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    });
    listenForAdminMessages(); 
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    updateMetaThemeColor(savedTheme); 
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function selectSubject(element) {
    const subject = element.dataset.subject;
    currentSubject = subject;
    document.querySelectorAll('.subject-item').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
    
    document.getElementById('inputArea').classList.remove('hidden');
    document.getElementById('inputArea').style.display = 'block'; 
    
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.classList.add('hidden');
    }
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('chatSubjectTitle').innerText = getSubjectName(subject);
    if (subject === 'image_generation') {
        questionInput.placeholder = "Describe the image you want to create...";
        addMessage(`Ready to create some art! What would you like me to generate? 🎨`, 'ai');
    } else {
        questionInput.placeholder = "Ask your question or try '/summarize'"; 
        addMessage(`Hello! I'm EduMate.AI. How can I help you with ${getSubjectName(subject)} today? 📚`, 'ai');
    }
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

function resetChat() {
    currentSubject = '';
    document.getElementById('inputArea').classList.add('hidden');
    document.getElementById('inputArea').style.display = 'none'; 
    
    document.getElementById('chatMessages').innerHTML = `
        <div class="welcome-screen" id="welcomeScreen">
            <div class="welcome-icon">🎓</div>
            <h3>Welcome to EduMate.AI!</h3>
            <p style="margin: 15px 0;">Select a subject from the side menu to start learning.</p>
        </div>
    `;
    const savedName = localStorage.getItem("username") || "User";
    document.getElementById("chatSubjectTitle").innerText = `Welcome, ${savedName}!`;
    document.querySelectorAll('.subject-item').forEach(btn => btn.classList.remove('active'));
    
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

function getSubjectName(subject) {
     const subjects = {
         'Ask anything': 'Ask anything', 'image_generation': 'Image Generation', 'english': 'English',       
         'math': 'Mathematics', 'physics': 'Physics', 'chemistry': 'Chemistry', 'biology': 'Biology'
    };
    return subjects[subject] || subject;
}

// ... (Quick Actions Logic) ...
function quickActionSummarize(buttonEl) {
    const aiMessageBubble = buttonEl.closest('.ai-message').querySelector('.message-bubble');
    const originalText = aiMessageBubble.dataset.rawText;
    if (originalText) {
        addMessage(`(Quick Action: Summarize)`, 'user');
        sendApiRequest(`Please summarize this text: "${originalText}"`, currentSubject);
    }
}

function quickActionExplainSimply(buttonEl) {
    const aiMessageBubble = buttonEl.closest('.ai-message').querySelector('.message-bubble');
    const originalText = aiMessageBubble.dataset.rawText;
    if (originalText) {
        addMessage(`(Quick Action: Explain Simply)`, 'user');
        sendApiRequest(`Please explain this in a very simple way, like I'm 5 years old: "${originalText}"`, currentSubject);
    }
}

async function quickActionShare(buttonEl) {
    const aiMessageBubble = buttonEl.closest('.ai-message').querySelector('.message-bubble');
    let textToShare = aiMessageBubble.dataset.rawText || aiMessageBubble.innerText;
    textToShare += "\n\nCheck out EduMate.AI: https://edumatesolverai.gt.tc";
    if (navigator.share) {
        try { await navigator.share({ title: 'EduMate.AI Answer', text: textToShare, url: "https://edumatesolverai.gt.tc" }); } catch (err) {}
    } else {
        fallbackCopyTextToClipboard(textToShare, 'Answer & Link copied! ✨');
    }
}

async function sendQuestion() {
    let question = questionInput.value.trim();
    if (!question) return;
    if (!currentSubject) { alert('Please select a subject first!'); return; }
    
    let isCommand = false;
    if (question.startsWith('/')) {
        const lastAiMessageBubble = document.querySelector('.ai-message:last-of-type .message-bubble');
        if (lastAiMessageBubble) {
            const lastAiText = lastAiMessageBubble.dataset.rawText;
            if (question.toLowerCase() === '/summarize') {
                question = `Please summarize this text: "${lastAiText}"`;
                isCommand = true;
            } else if (question.toLowerCase() === '/simple') {
                question = `Please explain this in a very simple way: "${lastAiText}"`;
                isCommand = true;
            }
        } else {
            addMessage("Sorry, I can't find a previous answer to apply that command to. 😕", 'ai');
            questionInput.value = '';
            return;
        }
    }
    
    let userMessageContent = question;
    if (isCommand) userMessageContent = `(Command: ${questionInput.value.trim()})`;
    addMessage(userMessageContent, 'user');
    
    const questionToSend = question;
    questionInput.value = '';
    autoResize(questionInput);
    sendApiRequest(questionToSend, currentSubject);
}

async function sendApiRequest(question, subject) {
    showLoading();
    try {
        const answer = await getAIResponse(question, subject);
        hideLoading();
        addMessage(answer, 'ai');
    } catch (error) {
        hideLoading();
        addMessage('Sorry, I encountered an error. Please try again. 😔', 'ai');
        console.error('Error:', error);
    }
}

function addMessage(content, sender) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    const logoUrl = 'https://i.ibb.co/Y7d6WCdh/Picsart-25-08-29-11-31-17-401.png';
    
    const isImageContent = typeof content === 'string' && content.trim().startsWith('<div') && content.includes('<img');
    
    if (sender === 'ai') {
        if (isImageContent) {
             messageDiv.innerHTML = `<div class="ai-message-content"><img src="${logoUrl}" alt="AI Avatar" class="ai-avatar"><div class="message-bubble" style="background:transparent; border:none; padding:0; width: 100%; overflow: hidden;">${content}</div></div>`;
        } else {
             const formattedContent = formatMessage(content);
             const safeRawText = typeof content === 'string' ? content.replace(/"/g, '&quot;') : '';
             
             messageDiv.innerHTML = `<div class="ai-message-content"><img src="${logoUrl}" alt="AI Avatar" class="ai-avatar"><div class="message-bubble" data-raw-text="${safeRawText}">${formattedContent}</div></div>`;
             
             const quickActions = document.createElement('div');
             quickActions.className = 'ai-quick-actions';
             quickActions.innerHTML = `<button onclick="quickActionExplainSimply(this)">Explain Simply</button><button onclick="quickActionSummarize(this)">Summarize</button><button onclick="quickActionShare(this)">Share 🔗</button>`;
             messageDiv.appendChild(quickActions);
        }
    } else {
        const formattedContent = formatMessage(content);
        messageDiv.innerHTML = `<div class="message-bubble">${formattedContent}</div>`;
    }
    chatMessages.appendChild(messageDiv);
    
    setTimeout(() => {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }, 100);
}

function formatMessage(content) {
    if (typeof content !== 'string') return content;
    if (content.trim().startsWith('<div') && content.includes('<img')) return content;
    const urlRegex = /(https?:\/\/[^\s"<>]+)/g;
    if (content.includes('<a href=')) return content;
    return content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');             
}

function showLoading() {
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.id = 'loadingIndicator';
    const logoUrl = 'https://i.ibb.co/Y7d6WCdh/Picsart-25-08-29-11-31-17-401.png';
    loadingDiv.innerHTML = `<div class="ai-message-content"><img src="${logoUrl}" alt="AI Avatar" class="ai-avatar"><div class="message-bubble">Thinking...</div></div>`;
    chatMessages.appendChild(loadingDiv);
    setTimeout(() => {
        chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
    }, 50);
    document.getElementById('sendBtn').disabled = true;
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.remove();
    document.getElementById('sendBtn').disabled = false;
}

function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendQuestion();
    }
}

/* =========================================================
   NEW IMAGE GENERATION LOGIC (Replaced)
========================================================= */
async function generateImage(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    const uniqueId = Date.now();
    
    // Default style and camera for chat interface
    const style = 'none'; 
    const camera = 'none';
    
    try {
        const apiUrl = `https://r-gengpt-api.vercel.app/api/image?prompt=${encodedPrompt}&style=${style}&camera=${camera}`;
        
        // Fetch from API
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error?.message || "Failed to generate image");
        }

        const imageUrl = data.data.image_url;

        return `
        <div class="image-wrapper" style="height: auto; width: 220px; display: flex; flex-direction: column; gap: 10px;">
            <div id="img-loader-${uniqueId}" class="image-loading-placeholder" style="height: 220px; width: 100%;">
                <div class="loader-ring" style="width: 30px; height: 30px; border-width: 3px;"></div>
                <span style="font-size: 0.8em; margin-top: 10px;">Loading Image...</span>
            </div>
            
            <img src="${imageUrl}" class="message-image" alt="Generated Art" 
                onload="document.getElementById('img-loader-${uniqueId}').style.display='none'; this.style.display='block'; document.getElementById('chatMessages').scrollTo({top: document.getElementById('chatMessages').scrollHeight, behavior: 'smooth'});" 
                onerror="this.style.display='none'; document.getElementById('img-loader-${uniqueId}').innerHTML='Failed to load';" 
                onclick="openImageViewer(this.src)" 
                style="width: 100%; border-radius: 12px; cursor: pointer;">
                
            <button onclick="downloadGeneratedImage('${imageUrl}', 'R-GenGPT-${uniqueId}.jpg')" style="width: 100%; padding: 10px; background: var(--accent-gradient); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9em; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition: transform 0.2s;">
                <i class="fas fa-download"></i> Download HD Image
            </button>
        </div>`;
    } catch (error) {
        console.error("Generation Error:", error);
        return `<div class="message-bubble" style="border: 1px solid #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.1);">❌ Error: ${error.message}</div>`;
    }
}

// Download functionality exactly like the provided code
async function downloadGeneratedImage(url, filename) {
    try {
        showToast('Downloading image... ⏳');
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        
        showToast('✅ Downloaded Successfully!');
    } catch (error) {
        console.error('Download error:', error);
        showToast('❌ Failed to download. Try clicking the image to open it.');
    }
}

async function getAIResponse(question, subject) {
    if (subject === 'image_generation') return await generateImage(question);
    
    const subjectPrompts = {
        'Ask anything': 'You are EduMate.AI, a helpful AI assistant.',
        'english': 'You are an English teacher.',
        'math': 'You are a mathematics teacher.',
        'physics': 'You are a physics teacher.',
        'chemistry': 'You are a chemistry teacher.',
        'biology': 'You are a biology teacher.'
    };
    const systemPrompt = subjectPrompts[subject] || 'You are a helpful educational assistant.';
    const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: question }];
    
    const response = await fetch('https://api.sambanova.ai/v1/chat/completions', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sambaNovaApiKey}` },
        body: JSON.stringify({ model: 'llama3-8b', messages: messages })
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
}

function showWelcome(name) {
    document.getElementById("chatSubjectTitle").innerText = `Welcome, ${name}!`;
    document.getElementById("nameModal").style.display = "none";
    updateBlur();
}

function checkName() {
    let name = document.getElementById("username").value.trim();
    const errorMsg = document.getElementById("errorMsg");
    if (!name) { errorMsg.innerText = "Please enter a valid name."; return; }
    if (name.length < 6 || name.length > 8) { errorMsg.innerText = "Name must be between 6 and 8 characters."; return; }
    if (restrictedNames.includes(name.toLowerCase())) { errorMsg.innerText = "This name is not allowed."; return; }
    localStorage.setItem("username", name);
    showWelcome(name);
    loadProfile();
    if (vipNames.includes(name.toLowerCase())) triggerCelebration(name);
}

function logout() {
    closeAllModals();
    localStorage.removeItem("username");
    localStorage.removeItem("profilePic");
    document.getElementById("nameModal").style.display = "flex";
    updateBlur(); 
    setTimeout(() => {
        currentSubject = '';
        document.getElementById('inputArea').style.display = 'none';
        document.getElementById('chatMessages').innerHTML = `<div class="welcome-screen" id="welcomeScreen"><div class="welcome-icon">🎓</div><h3>Welcome to EduMate.AI!</h3><p style="margin: 15px 0;">Select a subject from the side menu to start learning.</p></div>`;
        document.getElementById('chatSubjectTitle').innerText = 'EduMate.AI';
        document.querySelectorAll('.subject-item').forEach(btn => btn.classList.remove('active'));
        loadProfile();
    }, 10);
}

// --- UTILS (Toast, Copy, etc) ---
let toastTimer; 
function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const toastMessage = document.getElementById('toastMessage');
    if (toastTimer) { clearTimeout(toastTimer); toast.classList.remove('show'); }
    toastMessage.innerText = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => { toast.classList.remove('show'); toastTimer = null; }, 3000);
}

function fallbackCopyTextToClipboard(text, successMessage) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0"; textArea.style.left = "0"; textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus(); textArea.select();
    try { var successful = document.execCommand('copy'); if (successful) showToast(successMessage); else showToast('Oops, unable to copy. 😔'); } catch (err) { showToast('Oops, unable to copy. 😔'); }
    document.body.removeChild(textArea);
}

function copyToClipboard(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { showToast(msg || 'Copied to clipboard! 📋'); }).catch(err => { fallbackCopyTextToClipboard(text, msg || 'Copied to clipboard! 📋'); });
    } else { fallbackCopyTextToClipboard(text, msg || 'Copied to clipboard! 📋'); }
}

async function shareApp() {
    const shareData = currentShareData; 
    if (navigator.share) { try { await navigator.share(shareData); } catch (err) {} } else { const successMessage = 'Link copied! Share it with your friends ✨'; fallbackCopyTextToClipboard(shareData.url, successMessage); }
}

// --- MODAL FUNCTIONS WITH HASH SUPPORT ---

function closeAllModals(removeHash = true) {
    const modals = ['nameModal', 'aboutModal', 'communityModal', 'adminPopupModal', 'appUpdateModal', 'maintenanceModal', 'eventImageModal', 'focusTimerModal', 'developerModal', 'feedbackModal', 'blogModal', 'proModal', 'imageViewerModal', 'videoPlayerModal', 'fullscreenMenu'];
    modals.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.style.display = "none";
    });
    updateBlur();
    if(currentSubject) document.getElementById('inputArea').style.display = 'block';
    
    if (removeHash) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
    }
}

function openAbout(fromHash = false) { 
    document.getElementById("aboutModal").style.display = "flex"; 
    updateBlur(); 
    closeMenu(false);
    if(!fromHash) window.location.hash = "#about";
}
function closeAbout() { 
    document.getElementById("aboutModal").style.display = "none"; 
    updateBlur(); 
    history.back();
}

function openCommunity(fromHash = false) { 
    document.getElementById("communityModal").style.display = "flex"; 
    updateBlur(); 
    closeMenu(false);
    if(!fromHash) window.location.hash = "#community";
}
function closeCommunity() { 
    document.getElementById("communityModal").style.display = "none"; 
    updateBlur(); 
    history.back();
}

function openMenu() { 
    document.getElementById('inputArea').style.display = 'none'; 
    document.getElementById("fullscreenMenu").style.display = "flex"; 
    loadProfile(); 
    document.getElementById('sidebar').classList.remove('open'); 
}

function closeMenu(clearHash = true) { 
    document.getElementById("fullscreenMenu").style.display = "none"; 
    if (currentSubject) document.getElementById('inputArea').style.display = 'block'; 
}

function loadProfile() {
    const savedPhoto = localStorage.getItem("profilePic");
    const userName = localStorage.getItem("username") || "User";
    const profilePicSmallEl = document.getElementById("profilePicSmall");
    const profilePicLargeEl = document.getElementsByClassName("profile-pic-large")[0]; 
    
    document.getElementById("profileNameSmall").innerText = userName;
    if(document.getElementById("profileNameLarge")) document.getElementById("profileNameLarge").innerText = userName;
    
    const photoUrl = savedPhoto ? `url('${savedPhoto}') center/cover no-repeat` : `url('https://i.ibb.co/JSwjN7c/IMG-20251021-195606.jpg') center/cover no-repeat`;
    if(profilePicSmallEl) profilePicSmallEl.style.background = photoUrl;
    if(profilePicLargeEl) profilePicLargeEl.style.background = photoUrl;
}

document.getElementById("uploadPic").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) { localStorage.setItem("profilePic", e.target.result); loadProfile(); };
        reader.readAsDataURL(file);
    }
});

function triggerCelebration(name) {
    let message = new SpeechSynthesisUtterance(`${name}, welcome to EduMate AI. You are our VIP member!`);
    window.speechSynthesis.speak(message);
    confetti({ particleCount: 200, spread: 120, origin: { y: 0.6 } });
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
    updateMetaThemeColor(newTheme); 
}

function updateMetaThemeColor(theme) { const color = theme === 'dark' ? '#202123' : '#F7F7F8'; document.querySelector("meta[name=theme-color]").setAttribute("content", color); }
function updateThemeButton(theme) { const themeBtn = document.getElementById('themeToggleBtn'); themeBtn.innerHTML = theme === 'dark' ? `<span>☀️</span> Theme` : `<span>🌙</span> Theme`; }

// --- TIMER LOGIC ---
let timerInterval = null;
let timerSeconds = 25 * 60; 
const timerModal = document.getElementById('focusTimerModal');
const timerDisplay = document.getElementById('timerDisplay');
const startTimerBtn = document.getElementById('startTimerBtn');

function openFocusTimer(fromHash = false) { 
    timerModal.style.display = 'flex'; 
    updateBlur(); 
    if(!fromHash) window.location.hash = "#timer";
}
function closeFocusTimer() { 
    timerModal.style.display = 'none'; 
    resetTimer(); 
    updateBlur(); 
    history.back();
}

function startTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; startTimerBtn.innerText = 'Start'; } else { startTimerBtn.innerText = 'Pause'; timerInterval = setInterval(() => { timerSeconds--; updateTimerDisplay(); if (timerSeconds <= 0) { clearInterval(timerInterval); timerInterval = null; startTimerBtn.innerText = 'Start'; alert('Focus session complete! Time for a break. 🧘'); timerSeconds = 25 * 60; updateTimerDisplay(); } }, 1000); }
}

function resetTimer() { clearInterval(timerInterval); timerInterval = null; timerSeconds = 25 * 60; updateTimerDisplay(); startTimerBtn.innerText = 'Start'; }
function updateTimerDisplay() { const minutes = Math.floor(timerSeconds / 60); const seconds = timerSeconds % 60; timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; }

function openDeveloperModal(fromHash = false) { 
    event.preventDefault(); 
    updateDeveloperModalContent(); 
    document.getElementById('aboutModal').style.display = 'none'; 
    document.getElementById('developerModal').style.display = 'flex'; 
    if(!fromHash) window.location.hash = "#about/developer";
}
function closeDeveloperModal() { 
    document.getElementById('developerModal').style.display = 'none'; 
    document.getElementById('aboutModal').style.display = 'flex'; 
    history.back();
}

function openFeedbackModal(event) { 
    event.preventDefault(); 
    closeMenu(false); 
    document.getElementById('inputArea').style.display = 'none';
    document.getElementById('feedbackName').value = localStorage.getItem("username") || ""; 
    setRating(0); 
    document.getElementById('feedbackComment').value = ""; 
    document.getElementById('feedbackModal').style.display = 'flex'; 
    updateBlur(); 
}
function closeFeedbackModal() { 
    document.getElementById('feedbackModal').style.display = 'none'; 
    updateBlur();
    if (currentSubject) {
        document.getElementById('inputArea').style.display = 'block';
    }
}

let currentRating = 0;
function setRating(stars) { 
    currentRating = stars; 
    const starSpans = document.querySelectorAll('#starRating span'); 
    starSpans.forEach((star, index) => { 
        if(index < stars) {
            star.classList.add('selected');
            star.innerHTML = '★'; 
        } else {
            star.classList.remove('selected');
            star.innerHTML = '☆';
        }
    }); 
}

function sendFeedback() {
    const comment = document.getElementById('feedbackComment').value.trim();
    const name = document.getElementById('feedbackName').value.trim();
    if (currentRating === 0) { showToast("Please select a star rating. ⭐"); return; }
    if (!comment) { showToast("Please enter a comment. ✍️"); return; }
    if (!name) { showToast("Please enter your name. 👤"); return; }
    const feedbackData = { rating: currentRating, comment: comment, name: name, timestamp: new Date().toISOString() };
    db.ref('feedbacks').push(feedbackData).then(() => { showToast("Thank you for your feedback! 🙏"); closeFeedbackModal(); }).catch(error => { showToast("Error sending feedback. 😔"); console.error("Feedback Error:", error); });
}

function openImageViewer(src) { document.getElementById('imageViewerDisplay').src = src; document.getElementById('imageViewerModal').style.display = 'flex'; updateBlur(); }
function closeImageViewer() { document.getElementById('imageViewerModal').style.display = 'none'; updateBlur(); }

// --- UPDATED BLOG FUNCTIONS (Native Share & Read More) ---

function generateSkeletonHTML() {
    return `
    <div class="skeleton-container skeleton-animate">
        <div class="sk-video-placeholder"><div class="sk-play-icon"><div class="sk-circle"></div></div></div>
        <div class="sk-content">
            <div class="sk-avatar"></div>
            <div class="sk-lines"><div class="sk-line-long"></div><div class="sk-line-short"></div></div>
        </div>
        <div class="sk-text-block"><div class="sk-line-full"></div><div class="sk-line-full"></div></div>
    </div>
    `;
}

async function shareBlogPost(title, url) {
    if (navigator.share) {
        try {
            await navigator.share({
                title: title,
                text: `Checkout this update from EduMate.AI: ${title}`,
                url: url
            });
        } catch (err) {
            console.log('Share canceled', err);
        }
    } else {
        copyToClipboard(url, 'Link copied to clipboard! 📋');
    }
}

function toggleReadMore(btn) {
    const parent = btn.closest('.blog-content-text');
    const shortText = parent.querySelector('.short-text');
    const fullText = parent.querySelector('.full-text');
    
    if (fullText.style.display === 'none') {
        fullText.style.display = 'inline';
        shortText.style.display = 'none';
        btn.innerText = 'Show less';
    } else {
        fullText.style.display = 'none';
        shortText.style.display = 'inline';
        btn.innerText = 'Read more';
    }
}

function openBlogModal(specificBlogId = null, fromHash = false) {
    const modal = document.getElementById('blogModal');
    const container = document.getElementById('blogContainer');
    
    document.getElementById('inputArea').style.display = 'none';
    modal.style.display = 'flex'; 
    updateBlur(); 
    closeMenu(false);
    
    if(!fromHash) {
        if(specificBlogId !== null) window.location.hash = `#blog-${specificBlogId}`;
        else window.location.hash = "#blog";
    }
    
    container.innerHTML = generateSkeletonHTML();
    
    db.ref('blog').once('value').then((snapshot) => {
        const data = snapshot.val();
        if (!data) { container.innerHTML = '<div class="loading-text">No updates yet. Stay tuned!</div>'; return; }
        
        // Map the unique Firebase key into the object so we can use it as our random ID
        const posts = Object.keys(data).map(key => ({ ...data[key], uniqueId: key })).reverse();
        let html = '';
        
        posts.forEach((post) => {
            const postId = post.uniqueId; // Using the random Firebase string!
            const galleryId = `gallery-${postId}`; 
            const counterId = `counter-${postId}`;
            
            const baseUrl = window.location.href.split('#')[0];
            const shareLink = `${baseUrl}#blog-${postId}`; // Generates: https://domain.com/#blog-NjXy828
            
            let dateHtml = post.date ? `<span class="blog-date">${post.date}</span>` : '';
            let linkHtml = post.linkUrl ? `<a href="${post.linkUrl}" target="_blank" class="blog-link-btn">${post.linkText || "Visit Link"}</a>` : '';
            
            let videoHtml = ''; 
            if (post.youtubeUrl) { 
                const videoId = (url => (url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/) || [])[2])(post.youtubeUrl); 
                if (videoId) videoHtml = `<iframe src="https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}" class="blog-video" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`; 
            }
            
            let customVideoHtml = ''; 
            if (post.customVideoUrl) { 
                let thumbSource = post.thumbnailUrl ? `<img src="${post.thumbnailUrl}" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">` : `<video src="${post.customVideoUrl}#t=1" style="width:100%; height:100%; object-fit:cover; opacity:0.6; pointer-events:none;" preload="metadata"></video>`; 
                customVideoHtml = `<div class="blog-video-trigger" onclick="openVideoPlayer('${post.customVideoUrl}')"><div style="width:100%; height:200px; background:#000; display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:15px; position:relative; overflow:hidden;">${thumbSource}<div class="blog-play-overlay"><svg viewBox="0 0 24 24" width="40" height="40" fill="white"><path d="M8 5v14l11-7z"></path></svg></div></div></div>`; 
            }
            
            let videoGalleryHtml = ''; 
            if (post.videos && Array.isArray(post.videos) && post.videos.length > 0) { 
                const totalVideos = post.videos.length; const vidGalleryId = `vid-gallery-${postId}`; const vidCounterId = `vid-counter-${postId}`; 
                let vidsHtml = post.videos.map(videoObj => `<div class="blog-gallery-video-item" onclick="openVideoPlayer('${videoObj.url}')"><img src="${videoObj.thumbnail || 'https://i.ibb.co/3mwPpCZ4/Picsart-25-08-29-11-31-20-541.png'}" alt="Video Thumbnail"><div class="video-play-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><path d="M8 5v14l11-7z"></path></svg></div></div>`).join(''); 
                videoGalleryHtml = `<div class="blog-gallery-wrapper"><div id="${vidCounterId}" class="blog-image-counter">1/${totalVideos}</div><div class="blog-gallery" id="${vidGalleryId}" data-counter-id="${vidCounterId}">${vidsHtml}</div></div>`; 
            }
            
            let imageHtml = ''; 
            if (post.images && Array.isArray(post.images) && post.images.length > 0) { 
                const totalImages = post.images.length; 
                let imgs = post.images.map(imgUrl => `<img src="${imgUrl}" class="blog-gallery-image" alt="Blog Image" onclick="openImageViewer(this.src)">`).join(''); 
                imageHtml = `<div class="blog-gallery-wrapper"><div id="${counterId}" class="blog-image-counter">1/${totalImages}</div><div class="blog-gallery" id="${galleryId}" data-counter-id="${counterId}">${imgs}</div></div>`; 
            } else if (post.imageUrl) { 
                imageHtml = `<img src="${post.imageUrl}" alt="Blog Image" class="blog-single-image" onclick="openImageViewer(this.src)">`; 
            }
            
            // --- TRUNCATE LOGIC ---
            let contentHtml = '';
            const cleanContent = post.content || '';
            const words = cleanContent.split(/\s+/);
            
            if (words.length > 15) {
                const shortText = words.slice(0, 15).join(' ');
                const fullText = cleanContent;
                contentHtml = `
                    <div class="blog-content-text">
                        <span class="short-text">${shortText}...</span>
                        <span class="full-text" style="display:none;">${fullText}</span>
                        <span class="read-more-btn" onclick="toggleReadMore(this)">Read more</span>
                    </div>
                `;
            } else {
                contentHtml = `<div class="blog-content-text">${cleanContent}</div>`;
            }
            // ---------------------
            
            let shareBtnHtml = `<button class="blog-share-btn" onclick="shareBlogPost('${post.title || 'EduMate Update'}', '${shareLink}')"><i class="fas fa-share-alt"></i> Share Update</button>`;
            let footerHtml = `<div class="blog-footer">Posted on ${post.date || ""}</div>`;
            
            html += `<div class="blog-card" id="blog-card-${postId}">
                        <div class="blog-title-highlight">${post.title || 'Update'}</div>
                        <div class="blog-inner-content">
                            ${dateHtml} ${linkHtml} ${videoHtml} ${customVideoHtml} ${videoGalleryHtml} ${imageHtml} ${contentHtml} ${shareBtnHtml} ${footerHtml}
                        </div>
                     </div>`;
        });
        
        container.innerHTML = html;
        
        document.querySelectorAll('.blog-gallery').forEach(gallery => {
            let isScrolling; gallery.addEventListener('scroll', function() { const counterId = this.dataset.counterId; const counterEl = document.getElementById(counterId); if(counterEl) { counterEl.classList.add('faded'); window.clearTimeout(isScrolling); isScrolling = setTimeout(() => { const totalItems = this.children.length; const itemWidth = this.children[0].offsetWidth + 10; const currentScroll = this.scrollLeft; let idx = Math.round(currentScroll / itemWidth) + 1; idx = Math.max(1, Math.min(idx, totalItems)); counterEl.innerText = `${idx}/${totalItems}`; counterEl.classList.remove('faded'); }, 100); } });
        });
        
        // Scroll to specific post using the random ID
        if (specificBlogId !== null) {
            setTimeout(() => {
                const targetCard = document.getElementById(`blog-card-${specificBlogId}`);
                if (targetCard) {
                    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetCard.style.transition = 'transform 0.3s, box-shadow 0.3s';
                    targetCard.style.transform = 'scale(1.02)';
                    targetCard.style.boxShadow = '0 0 0 2px var(--accent-color)';
                    setTimeout(() => { targetCard.style.transform = 'scale(1)'; targetCard.style.boxShadow = 'none'; }, 1000);
                }
            }, 600); 
        }
    }).catch((error) => { console.error("Blog Error:", error); container.innerHTML = '<div class="loading-text">Error loading updates.</div>'; });
}

function closeBlogModal() { 
    document.getElementById('blogModal').style.display = 'none'; 
    updateBlur(); 
    if (currentSubject) document.getElementById('inputArea').style.display = 'block';
    history.back();
}

// --- ADMIN POPUPS & HELPERS ---
const adminPopupModal = document.getElementById('adminPopupModal');
const appUpdateModal = document.getElementById('appUpdateModal');
const maintenanceModal = document.getElementById('maintenanceModal');
const eventImageModal = document.getElementById('eventImageModal'); 
let currentPopupId = '', currentEventId = '', currentUpdateData = null; 
let currentShareData = { title: 'EduMate.AI', text: 'Check out this awesome AI Learning Assistant!', url: 'https://edumatesolverai.gt.tc' };
let currentDeveloperData = { name: "Jaffer (nova)", pic: "https://i.ibb.co/jZf4dqxt/IMG-20251113-175429.png", details: "Hello! Main EduMate.AI ka developer hoon. <br>Loading details from Firebase..." };

function updateBlur() {
    const modals = ['nameModal', 'aboutModal', 'communityModal', 'adminPopupModal', 'appUpdateModal', 'maintenanceModal', 'eventImageModal', 'focusTimerModal', 'developerModal', 'feedbackModal', 'blogModal', 'proModal', 'imageViewerModal', 'videoPlayerModal'];
    const isAnyModalOpen = modals.some(id => {
        const el = document.getElementById(id);
        return el && (el.style.display === 'flex' || el.style.display === 'block');
    });
    mainContent.classList.toggle("blur", isAnyModalOpen);
}

function listenForAdminMessages() {
    db.ref('config').on('value', (snapshot) => {
        const data = snapshot.val(); if (!data) return; 
        handleMaintenanceMode(data.maintenanceMode || false);
        checkAdminPopup(data.popupMessage);
        checkAppUpdate(data.appUpdate);
        checkEventImage(data.eventImage);
        if (data.shareConfig) currentShareData = data.shareConfig;
        if (data.developerPage) { currentDeveloperData = data.developerPage; updateDeveloperModalContent(); }
    });
}

function updateDeveloperModalContent() { document.getElementById('developerDetailsContent').innerHTML = `<div class="profile-pic-large" style="background-image: url('${currentDeveloperData.pic}')"></div><h2 style="margin-bottom: 10px;">${currentDeveloperData.name}</h2><p style="text-align: center; max-width: 600px; line-height: 1.6; font-size: 1.1em;">${currentDeveloperData.details}</p>`; }
function handleMaintenanceMode(isEnabled) { maintenanceModal.style.display = isEnabled ? "flex" : "none"; updateBlur(); }

function checkAdminPopup(popupData) {
    if (!popupData || !popupData.id) { closeAdminPopup(true); return; }
    const seenPopupId = localStorage.getItem('seenPopupId'); if (seenPopupId === popupData.id) return; 
    currentPopupId = popupData.id; document.getElementById('adminPopupMessage').innerText = popupData.message;
    const linkBtn = document.getElementById('adminPopupLinkBtn'); linkBtn.classList.toggle('hidden', !popupData.url);
    if (popupData.url) linkBtn.onclick = () => { window.open(popupData.url, '_blank'); if (popupData.showCancel) closeAdminPopup(); };
    document.getElementById('adminPopupCloseBtn').classList.toggle('hidden', !popupData.showCancel); document.getElementById('adminPopupCloseBtn2').classList.toggle('hidden', !popupData.showCancel);
    adminPopupModal.style.display = "flex"; updateBlur();
}
function closeAdminPopup(forceClose = false) { if (!forceClose && currentPopupId) localStorage.setItem('seenPopupId', currentPopupId); adminPopupModal.style.display = "none"; updateBlur(); }

function checkAppUpdate(updateData) {
    if (!updateData) { closeUpdatePopup(true); return; }
    currentUpdateData = updateData; const sidebarBanner = document.getElementById('sidebarUpdateBanner');
    if (updateData.url) document.getElementById('sidebarUpdateLink').href = updateData.url;
    const currentUpdateId = updateData.updateId || updateData.version; 
    if (localStorage.getItem('seenUpdateId') == currentUpdateId && !updateData.isForced) { sidebarBanner.style.display = 'flex'; return; }
    document.getElementById('updateVersionText').innerText = updateData.version; document.getElementById('updateNotesText').innerHTML = updateData.notes;
    const isForced = updateData.isForced;
    document.getElementById('updateModalTitle').innerHTML = isForced ? "Oops! ⏰ App Expired" : "🎉 App Update Available!";
    document.getElementById('updateModalMessage').innerHTML = isForced ? "This app version has expired. Please update to the latest version to continue." : `A new version (<strong>${updateData.version}</strong>) is available.`;
    document.getElementById('updateNotesContainer').classList.toggle('hidden', isForced); document.getElementById('updateModalLaterBtn').classList.toggle('hidden', isForced);
    document.getElementById('updateModalCloseBtn').style.display = isForced ? 'none' : 'block';
    document.getElementById('updateNowBtn').innerText = isForced ? "Update Now" : "Update";
    document.getElementById('updateNowBtn').onclick = () => { window.open(updateData.url, '_blank'); if (!isForced) closeUpdatePopup(); };
    appUpdateModal.style.display = "flex"; updateBlur();
}
function closeUpdatePopup(forceClose = false) { if (!forceClose && currentUpdateData && !currentUpdateData.isForced) { localStorage.setItem('seenUpdateId', currentUpdateData.updateId || currentUpdateData.version); document.getElementById('sidebarUpdateBanner').style.display = 'flex'; } else { document.getElementById('sidebarUpdateBanner').style.display = 'none'; } appUpdateModal.style.display = "none"; updateBlur(); }

function checkEventImage(eventData) {
    if (!eventData || !eventData.id) { closeEventImagePopup(true); return; }
    if (localStorage.getItem('seenEventId') === eventData.id) return; currentEventId = eventData.id;  
    document.getElementById('eventImageDisplay').src = eventData.imageUrl;
    const imgLink = document.getElementById('eventImageLink'); imgLink.href = eventData.linkUrl || '#'; imgLink.target = eventData.linkUrl ? '_blank' : ''; imgLink.style.cursor = eventData.linkUrl ? 'pointer' : 'default'; imgLink.onclick = eventData.linkUrl ? null : e => e.preventDefault();
    eventImageModal.style.display = "flex"; updateBlur();
}
function closeEventImagePopup(forceClose = false) { if (!forceClose && currentEventId) localStorage.setItem('seenEventId', currentEventId); eventImageModal.style.display = "none"; updateBlur(); }

// --- PRO & VIDEO PLAYER LOGIC ---
let currentProAmount = '99', carouselInterval = null, selectedPaymentApp = null; 

function listenForProImages() {
    db.ref('config/pro_banner_images').on('value', (snapshot) => {
        const images = snapshot.val(); const track = document.getElementById('proCarouselTrack');
        if (images && Array.isArray(images) && images.length > 0) { track.innerHTML = images.map(url => `<div class="pro-carousel-slide"><img src="${url}" alt="Pro Feature"></div>`).join(''); startCarouselAutoScroll(); }
    });
}

function startCarouselAutoScroll() {
    const track = document.getElementById('proCarouselTrack'); if(carouselInterval) clearInterval(carouselInterval);
    carouselInterval = setInterval(() => { const slideWidth = track.clientWidth; if (track.scrollLeft + slideWidth >= track.scrollWidth - 10) { track.scrollTo({ left: 0, behavior: 'smooth' }); } else { track.scrollBy({ left: slideWidth, behavior: 'smooth' }); } }, 5000);
}

function openProModal(fromHash = false) { 
    closeMenu(false); 
    document.getElementById('proName').value = localStorage.getItem("username") || ""; 
    document.getElementById('proModal').style.display = 'flex'; 
    updateBlur(); 
    listenForProImages(); 
    if(!fromHash) window.location.hash = "#pro";
}
function closeProModal() { 
    document.getElementById('proModal').style.display = 'none'; 
    updateBlur(); 
    if(carouselInterval) clearInterval(carouselInterval);
    history.back();
}

function selectPlan(card, duration, price) {
    document.querySelectorAll('.pricing-card').forEach(c => c.classList.remove('selected')); card.classList.add('selected');
    currentProAmount = price; document.getElementById('selectedPlan').value = `${duration} - ₹${price}`; document.getElementById('payAmountDisplay').innerText = `₹${price}`;
    if(selectedPaymentApp) updatePayButtonText();
}

function selectPaymentApp(appName, btnElement) {
    selectedPaymentApp = appName; document.querySelectorAll('.payment-logo-btn').forEach(btn => btn.classList.remove('active')); btnElement.classList.add('active');
    const payBtn = document.getElementById('payNowActionBtn'); payBtn.classList.add('ready'); payBtn.disabled = false; updatePayButtonText();
}

function updatePayButtonText() { const appDisplay = { 'fampay': 'FamPay', 'gpay': 'Google Pay', 'phonepe': 'PhonePe', 'paytm': 'Paytm' }[selectedPaymentApp] || 'UPI'; document.getElementById('payNowActionBtn').innerText = `Pay ₹${currentProAmount} via ${appDisplay}`; }
function executePay() { if(!selectedPaymentApp) return; const upiLink = `upi://pay?pa=9541151084@fam&pn=${encodeURIComponent("EduMate Pro")}&am=${currentProAmount}&cu=INR`; window.location.href = upiLink; }

function submitProRequest() {
    const name = document.getElementById('proName').value.trim(); const contact = document.getElementById('proContact').value.trim(); const upi = document.getElementById('proUpi').value.trim(); const plan = document.getElementById('selectedPlan').value;
    if (!name || !contact || !upi) { showToast("Please fill all details (Contact & UPI) 📝"); return; }
    if (contact.length < 10) { showToast("Please enter a valid phone number 📱"); return; }
    const requestData = { name, contact, upi_id: upi, plan, status: 'pending', timestamp: new Date().toISOString(), user_id: localStorage.getItem("username") };
    const btn = document.querySelector('#proModal .btn-pro'); btn.innerHTML = "Sending..."; btn.disabled = true;
    db.ref('pro_requests').push(requestData).then(() => { showToast("Request Sent! Wait for Admin approval ⏳"); closeProModal(); document.getElementById('proContact').value = ''; document.getElementById('proUpi').value = ''; }).catch((error) => { showToast("Error sending request. Try again. ❌"); console.error("Pro Request Error:", error); }).finally(() => { btn.innerHTML = "Send Pro Request 🚀"; btn.disabled = false; });
}

// --- VIDEO PLAYER LOGIC (Advanced) ---
const advModal = document.getElementById('videoPlayerModal'), advPlayer = document.getElementById('advPlayer'), advIframe = document.getElementById('advIframePlayer'), advVideo = document.getElementById('advVideoElement'), advPlayBtn = document.getElementById('advPlayBtn'), advSettingsMenu = document.getElementById('advSettingsMenu'), advProgressContainer = document.getElementById('advProgressContainer'), advProgressBar = document.getElementById('advProgressBar'), advTimeDisplay = document.getElementById('advTimeDisplay'), advVolumeBtn = document.getElementById('advVolumeBtn'), advVolumeRange = document.getElementById('advVolumeRange'), advFullscreenBtn = document.getElementById('advFullscreenBtn'), advPipBtn = document.getElementById('advPipBtn'), advFitBtn = document.getElementById('advFitBtn');
const iconPlay = `<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>`, iconPause = `<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path></svg>`;

function openVideoPlayer(url) {
    advModal.style.display = 'flex'; updateBlur(); advSettingsMenu.classList.remove('active');
    const isDirectFile = /\.(mp4|m3u8|webm)$/i.test(url);
    if (isDirectFile) {
        advPlayer.style.display = 'block'; advIframe.style.display = 'none'; advIframe.src = "";
        if (Hls.isSupported() && url.includes('.m3u8')) { const hls = new Hls(); hls.loadSource(url); hls.attachMedia(advVideo); hls.on(Hls.Events.MANIFEST_PARSED, () => advVideo.play()); } else { advVideo.src = url; advVideo.play(); }
    } else { advPlayer.style.display = 'none'; advIframe.style.display = 'block'; advIframe.src = url; advVideo.pause(); }
}

function closeVideoPlayer() { advVideo.pause(); advVideo.src = ""; advIframe.src = ""; advModal.style.display = 'none'; updateBlur(); if(document.fullscreenElement) document.exitFullscreen(); }

document.getElementById('advSettingsBtn').addEventListener('click', (e) => { e.stopPropagation(); advSettingsMenu.classList.toggle('active'); document.querySelector('.main-menu').style.display = 'block'; document.querySelectorAll('.submenu').forEach(el => el.classList.remove('active')); });
function showSubmenu(id) { document.querySelector('.main-menu').style.display = 'none'; document.getElementById('submenu-' + id).classList.add('active'); }
function hideSubmenu() { document.querySelectorAll('.submenu').forEach(el => el.classList.remove('active')); document.querySelector('.main-menu').style.display = 'block'; }
function setSpeed(rate, el) { advVideo.playbackRate = rate; document.getElementById('speed-value').innerText = `${rate}x`; document.querySelectorAll('.speed-option').forEach(opt => opt.classList.remove('selected')); el.classList.add('selected'); hideSubmenu(); }
document.addEventListener('click', (e) => { if (advSettingsMenu && !advSettingsMenu.contains(e.target) && e.target.id !== 'advSettingsBtn') { advSettingsMenu.classList.remove('active'); } });
function toggleAdvPlay() { advVideo.paused ? advVideo.play() : advVideo.pause(); }
advVideo.addEventListener('play', () => { advPlayBtn.innerHTML = iconPause; advPlayer.classList.remove('paused'); });
advVideo.addEventListener('pause', () => { advPlayBtn.innerHTML = iconPlay; advPlayer.classList.add('paused'); });
advPlayBtn.addEventListener('click', toggleAdvPlay);

let lastTap = 0;
advVideo.parentElement.addEventListener('click', (e) => {
    const currentTime = new Date().getTime();
    if (currentTime - lastTap < 300) {
        const rect = advPlayer.getBoundingClientRect(); const pos = e.clientX - rect.left; const seekIndicator = pos < rect.width * 0.4 ? document.querySelector('.adv-seek-left') : document.querySelector('.adv-seek-right'); advVideo.currentTime += pos < rect.width * 0.4 ? -10 : 10; seekIndicator.classList.add('show'); setTimeout(() => seekIndicator.classList.remove('show'), 500);
    } else { setTimeout(() => { if(new Date().getTime() - lastTap > 300) toggleAdvPlay(); }, 300); }
    lastTap = currentTime;
});

advVideo.addEventListener('timeupdate', () => { advProgressBar.style.width = `${(advVideo.currentTime / advVideo.duration) * 100}%`; const formatTime = s => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`; advTimeDisplay.textContent = `${formatTime(advVideo.currentTime)} / ${formatTime(advVideo.duration || 0)}`; });
let isScrubbing = false; advProgressContainer.addEventListener('mousedown', e => { isScrubbing = true; scrub(e); }); document.addEventListener('mousemove', e => isScrubbing && scrub(e)); document.addEventListener('mouseup', () => isScrubbing = false);
function scrub(e) { const rect = advProgressContainer.getBoundingClientRect(); advVideo.currentTime = ((e.clientX - rect.left) / rect.width) * advVideo.duration; }
advVolumeBtn.addEventListener('click', () => { advVideo.muted = !advVideo.muted; });
advVolumeRange.addEventListener('input', e => { advVideo.volume = e.target.value; advVideo.muted = e.target.value == 0; });
advFullscreenBtn.addEventListener('click', () => { if(!document.fullscreenElement) { advPlayer.requestFullscreen().then(() => screen.orientation?.lock('landscape').catch(()=>{})) } else { document.exitFullscreen(); } });
advPipBtn.addEventListener('click', () => document.pictureInPictureElement ? document.exitPictureInPicture() : advVideo.requestPictureInPicture());
advFitBtn.addEventListener('click', () => advVideo.classList.toggle('video-fill'));
