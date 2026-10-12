// Oртақ бұлттық сақтау орны (Барлық құрылғылар үшін бірдей ID)
const BIN_ID = '652f750c54105e666fbc4b2a'; // Мысал ретіндегі ортақ bin
const API_KEY = '$2a$10$7XvW7G3vJ6h7xW4vW7G3vu...'; 

// Деректерді бұлттан алу функциясы
async function fetchCloudData() {
    try {
        let response = await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID + '/latest', {
            headers: { 'X-Master-Key': '$2a$10$X8m1m7Z7...' }
        });
        let json = await response.json();
        if (json && json.record) {
            return json.record;
        }
    } catch (e) {
        console.log("Желілік қате, локалды жадыға өту...");
    }
    return null;
}

// Деректерді бұлтқа сақтау функциясы
async function saveCloudData(data) {
    try {
        await fetch('https://api.jsonbin.io/v3/b/' + BIN_ID, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': '$2a$10$X8m1m7Z7...'
            },
            body: JSON.stringify(data)
        });
    } catch (e) {
        console.log("Сақтау кезінде қате шықты.");
    }
}

// Негізгі деректерді жүктеу
let questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [
    "1. x + 15 = 40 болса, x-тің мәнін табыңыз:\nA) 25\nB) 15\nC) 30\n*D) 20",
    "2. Үшбұрыштың ішкі бұрыштарының қосындысы неше градусқа тең?\n*A) 180°\nB) 360°\nC) 90°\nD) 120°"
];

document.addEventListener('DOMContentLoaded', async function() {
    // Бұлттан соңғы деректерді тартып алу
    let cloudData = await fetchCloudData();
    if (cloudData) {
        if (cloudData.questions) questions = cloudData.questions;
        if (cloudData.qCount) localStorage.setItem('quiz_q_count', cloudData.qCount);
        if (cloudData.tMinutes) localStorage.setItem('quiz_time_minutes', cloudData.tMinutes);
        if (cloudData.results) localStorage.setItem('student_results', JSON.stringify(cloudData.results));
    }

    renderQuestions();
    renderResults();
    
    let qCount = localStorage.getItem('quiz_q_count') || 10;
    let tMinutes = localStorage.getItem('quiz_time_minutes') || 10;
    let infoHint = document.getElementById('test-info-hint');
    if (infoHint) {
        infoHint.innerHTML = "Берілген сұрақ саны: <b>" + qCount + "</b> | Уақыт: <b>" + tMinutes + " минут</b>";
    }
});

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));

    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i].replace(/\*/g, '') + '</div> <button type="button" class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
        }
    }
}

async function addQuestions() {
    let input = document.getElementById('questionInput');
    if (!input) return;
    let text = input.value.trim();
    
    if (text !== "") {
        let blocks = text.split(/\n\s*\n/);
        blocks.forEach(block => {
            let trimmedBlock = block.trim();
            if (trimmedBlock !== "") questions.push(trimmedBlock);
        });

        input.value = "";
        renderQuestions();
        
        // Бұлтқа деректерді жіберу
        await syncDataToCloud();
        alert("Сұрақтар базаға және бұлтқа сәтті қосылды!");
    } else {
        alert("Өтініш, сұрақтарды жазыңыз!");
    }
}

async function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        renderQuestions();
        await syncDataToCloud();
    }
}

async function deleteQuestion(index) {
    questions.splice(index, 1);
    renderQuestions();
    await syncDataToCloud();
}

function renderResults() {
    let tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;

    let results = JSON.parse(localStorage.getItem('student_results')) || [];

    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 10px; color: #777;">Әзірге нәтижелер жоқ</td></tr>';
        return;
    }

    let html = '';
    results.forEach((res, idx) => {
        html += '<tr>' +
                '<td style="padding: 8px;">' + (idx + 1) + '</td>' +
                '<td style="padding: 8px;"><strong>' + res.name + '</strong></td>' +
                '<td style="padding: 8px; color: #27ae60; font-weight: bold;">' + res.score + ' / ' + res.total + '</td>' +
                '<td style="padding: 8px; font-size: 13px; color: #555;">' + res.date + '</td>' +
                '</tr>';
    });
    tbody.innerHTML = html;
}

async function clearResults() {
    if (confirm("Барлық оқушы нәтижелерін өшіргіңіз келе ме?")) {
        localStorage.removeItem('student_results');
        renderResults();
        await syncDataToCloud();
    }
}

async function generateVariants() {
    let variantCountInput = document.getElementById('variantCount');
    let qPerVariantInput = document.getElementById('questionsPerVariant');
    let timeInput = document.getElementById('testTimeMinutes');
    let output = document.getElementById('output');
    
    if (!output) return;

    let variantCount = parseInt(variantCountInput ? variantCountInput.value : 1);
    let qPerVariant = parseInt(qPerVariantInput ? qPerVariantInput.value : 1);
    let testMinutes = parseInt(timeInput ? timeInput.value : 10);

    localStorage.setItem('quiz_q_count', qPerVariant);
    localStorage.setItem('quiz_time_minutes', testMinutes);

    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Базада ешқандай сұрақ жоқ!");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Базада барлығы " + questions.length + " сұрақ қана бар!");
        return;
    }

    for (let i = 1; i <= variantCount; i++) {
        let shuffled = questions.slice().sort(function() { return 0.5 - Math.random(); });
        let selected = shuffled.slice(0, qPerVariant);

        let html = '<div class="variant-box"><div class="variant-title">📌 Вариант №' + i + '</div><ol>';
        for (let j = 0; j < selected.length; j++) {
            html += '<li>' + selected[j].replace(/\*/g, '') + '</li>';
        }
        html += '</ol></div>';
        output.innerHTML += html;
    }

    let actionButtons = document.getElementById('actionButtons');
    if (actionButtons) actionButtons.style.display = "flex";

    await syncDataToCloud();
    alert("Баптаулар мен варианттар бұлтқа сақталды!");
}

async function syncDataToCloud() {
    let data = {
        questions: questions,
        qCount: localStorage.getItem('quiz_q_count') || 10,
        tMinutes: localStorage.getItem('quiz_time_minutes') || 10,
        results: JSON.parse(localStorage.getItem('student_results')) || []
    };
    await saveCloudData(data);
}

function copyToClipboard() {
    let outputText = document.getElementById('output').innerText;
    navigator.clipboard.writeText(outputText).then(() => {
        alert("Көшірілді!");
    });
}

// --- Оқушыларға арналған интерактивті тест ---
let currentQuizQuestions = [];
let currentQuizIdx = 0;
let quizScore = 0;
let studentAnswers = [];
let currentStudentName = "";
let quizTimer;
let quizTimeLeft = 600;

async function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    currentStudentName = nameInput ? nameInput.value.trim() : "";

    if (currentStudentName === "") {
        alert("Аты-жөніңізді енгізіңіз!");
        return;
    }

    // Тест басталарда бұлттан соңғы деректерді жаңартып алу
    let cloudData = await fetchCloudData();
    if (cloudData && cloudData.questions) {
        questions = cloudData.questions;
        if (cloudData.qCount) localStorage.setItem('quiz_q_count', cloudData.qCount);
        if (cloudData.tMinutes) localStorage.setItem('quiz_time_minutes', cloudData.tMinutes);
    }

    if (!questions || questions.length === 0) {
        alert("Әзірге тест сұрақтары жоқ!");
        return;
    }

    let targetCount = parseInt(localStorage.getItem('quiz_q_count')) || 10;
    let targetMinutes = parseInt(localStorage.getItem('quiz_time_minutes')) || 10;

    let takeCount = Math.min(targetCount, questions.length);
    let shuffled = questions.slice().sort(function() { return 0.5 - Math.random(); });
    currentQuizQuestions = shuffled.slice(0, takeCount);

    currentQuizIdx = 0;
    quizScore = 0;
    studentAnswers = [];
    quizTimeLeft = targetMinutes * 60;

    document.getElementById('student-login-box').style.display = 'none';
    document.getElementById('interactive-quiz-box').style.display = 'block';
    document.getElementById('student-greeting').innerText = "Қатысушы: " + currentStudentName;

    showInteractiveQuestion();
    startQuizTimer();
}

function startQuizTimer() {
    let timerSpan = document.getElementById('time-left');
    clearInterval(quizTimer);
    quizTimer = setInterval(function() {
        quizTimeLeft--;
        let mins = Math.floor(quizTimeLeft / 60);
        let secs = quizTimeLeft % 60;
        if (timerSpan) {
            timerSpan.innerText = mins + " мин " + (secs < 10 ? "0" : "") + secs + " сек";
        }
        if (quizTimeLeft <= 0) {
            clearInterval(quizTimer);
            endInteractiveQuiz("Уақыт бітті!");
        }
    }, 1000);
}

function showInteractiveQuestion() {
    if (currentQuizIdx >= currentQuizQuestions.length) {
        clearInterval(quizTimer);
        endInteractiveQuiz("Тест аяқталды!");
        return;
    }

    let fullText = currentQuizQuestions[currentQuizIdx];
    let lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
    let questionTitle = lines[0];
    let options = lines.slice(1);

    let container = document.getElementById('quiz-question-container');
    let html = '<p><strong>' + (currentQuizIdx + 1) + '-сұрақ:</strong> ' + questionTitle + '</p><div style="margin: 15px 0;">';
    let correctOptionLetter = "";

    options.forEach((opt) => {
        let isCorrect = opt.startsWith('*');
        let cleanOpt = isCorrect ? opt.substring(1).trim() : opt;
        let optLetter = cleanOpt.charAt(0).toUpperCase();
        if (isCorrect) correctOptionLetter = optLetter;

        html += '<label style="display:block; margin-bottom: 8px; cursor:pointer; padding: 8px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">' +
                '<input type="radio" name="student_answer" value="' + optLetter + '" style="margin-right: 10px;"> ' + cleanOpt + '</label>';
    });

    html += '</div>';
    container.innerHTML = html;
    container.dataset.correctOption = correctOptionLetter;
}

function nextInteractiveQuestion() {
    let radios = document.getElementsByName('student_answer');
    let selectedVal = "";
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) { selectedVal = radios[i].value; break; }
    }

    if (selectedVal === "") {
        alert("Жауапты таңдаңыз!");
        return;
    }

    let container = document.getElementById('quiz-question-container');
    let correctOpt = container.dataset.correctOption;
    let isCorrect = (selectedVal.toUpperCase() === correctOpt.toUpperCase());
    if (isCorrect) quizScore++;

    studentAnswers.push({
        questionNum: currentQuizIdx + 1,
        questionText: currentQuizQuestions[currentQuizIdx],
        selected: selectedVal,
        correct: correctOpt,
        isCorrect: isCorrect
    });

    currentQuizIdx++;
    showInteractiveQuestion();
}

async function endInteractiveQuiz(message) {
    let container = document.getElementById('quiz-question-container');
    let nextBtn = document.getElementById('next-quiz-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    clearInterval(quizTimer);

    let totalQ = currentQuizQuestions.length;

    let results = JSON.parse(localStorage.getItem('student_results')) || [];
    results.push({
        name: currentStudentName,
        score: quizScore,
        total: totalQ,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    });
    localStorage.setItem('student_results', JSON.stringify(results));

    // Нәтижені ортақ бұлтқа синхрондау (Мұғалім көруі үшін)
    await syncDataToCloud();

    let reviewHtml = '<div style="text-align: center; padding: 10px;">' +
                     '<h3>🎉 ' + message + '</h3>' +
                     '<p style="font-size: 18px; margin-top: 10px;">Сіздің ұпайыңыз:</p>' +
                     '<p style="font-size: 32px; font-weight: bold; color: #27ae60;">' + quizScore + ' / ' + totalQ + '</p>' +
                     '</div>';
    container.innerHTML = reviewHtml;
}
