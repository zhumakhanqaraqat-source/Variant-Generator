let questions = [];
let quizConfig = { qCount: 10, tMinutes: 10 };

// Сайт ашылғанда сілтемеден (URL) деректерді оқып алу
document.addEventListener('DOMContentLoaded', function() {
    loadDataFromURL();
    renderQuestions();
    renderResults();
    
    let infoHint = document.getElementById('test-info-hint');
    if (infoHint) {
        infoHint.innerHTML = "Берілген сұрақ саны: <b>" + quizConfig.qCount + "</b> | Уақыт: <b>" + quizConfig.tMinutes + " минут</b>";
    }
});

function loadDataFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encodedData = urlParams.get('data');
        
        if (encodedData) {
            const decodedJSON = decodeURIComponent(escape(atob(encodedData)));
            const parsedData = JSON.parse(decodedJSON);
            
            questions = parsedData.questions || [];
            quizConfig.qCount = parsedData.qCount || 10;
            quizConfig.tMinutes = parsedData.tMinutes || 10;
            
            // Телефонның жадында сақтап қоямыз
            localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
            localStorage.setItem('quiz_q_count', quizConfig.qCount);
            localStorage.setItem('quiz_time_minutes', quizConfig.tMinutes);
            return;
        }
    } catch (e) {
        console.log("Сілтемені оқу қатесі");
    }
    
    // Егер сілтемеде болмаса, бос тұрады (кодта сұрақ жоқ)
    questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
}

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i].replace(/\*/g, '') + '</div> <button type="button" class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
        }
    }
}

function addQuestions() {
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
        localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
        alert("Сұрақтар қосылды!");
    } else {
        alert("Өтініш, сұрақтарды жазыңыз!");
    }
}

function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        localStorage.removeItem('my_quiz_questions');
        renderQuestions();
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
    renderQuestions();
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

function clearResults() {
    if (confirm("Нәтижелерді өшіргіңіз келе ме?")) {
        localStorage.removeItem('student_results');
        renderResults();
    }
}

function generateVariants() {
    let variantCountInput = document.getElementById('variantCount');
    let qPerVariantInput = document.getElementById('questionsPerVariant');
    let timeInput = document.getElementById('testTimeMinutes');
    let output = document.getElementById('output');
    
    if (!output) return;

    let variantCount = parseInt(variantCountInput ? variantCountInput.value : 1);
    let qPerVariant = parseInt(qPerVariantInput ? qPerVariantInput.value : 1);
    let testMinutes = parseInt(timeInput ? timeInput.value : 10);

    quizConfig.qCount = qPerVariant;
    quizConfig.tMinutes = testMinutes;

    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Алдымен сұрақтарды енгізіңіз!");
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

    // Сұрақтарды басқа телефонда ашу үшін сілтеме жасау
    generateShareableLink();
}

function generateShareableLink() {
    let dataObj = {
        questions: questions,
        qCount: quizConfig.qCount,
        tMinutes: quizConfig.tMinutes
    };
    
    let jsonString = JSON.stringify(dataObj);
    let encodedData = btoa(unescape(encodeURIComponent(jsonString)));
    
    let baseUrl = window.location.href.split('?')[0];
    if (baseUrl.includes('teacher.html')) {
        baseUrl = baseUrl.replace('teacher.html', 'index.html');
    } else if (!baseUrl.endsWith('index.html') && !baseUrl.endsWith('/')) {
        baseUrl += '/index.html';
    }

    let fullShareLink = baseUrl + '?data=' + encodedData;

    let output = document.getElementById('output');
    if (output) {
        output.innerHTML += '<div style="margin-top: 15px; padding: 12px; background: #e8f8f5; border: 1px solid #27ae60; border-radius: 6px;">' +
                            '<p style="font-weight: bold; color: #27ae60; margin-bottom: 5px;">🔗 Басқа телефонда ашатын ортақ сілтеме:</p>' +
                            '<input type="text" id="shareLinkInput" value="' + fullShareLink + '" readonly style="width: 100%; padding: 8px; font-size: 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff;" onclick="this.select();">' +
                            '<button type="button" onclick="copyShareLink()" style="margin-top: 8px; background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">Сілтемені көшіру 📋</button>' +
                            '</div>';
    }
}

function copyShareLink() {
    let input = document.getElementById('shareLinkInput');
    if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
            alert("Сілтеме көшірілді! Мұны басқа телефонға жіберсеңіз, тест бірден ашылады.");
        });
    }
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

function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    currentStudentName = nameInput ? nameInput.value.trim() : "";

    if (currentStudentName === "") {
        alert("Аты-жөніңізді енгізіңіз!");
        return;
    }

    loadDataFromURL();
    if (questions.length === 0) {
        questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
    }

    if (!questions || questions.length === 0) {
        alert("Әзірге тест сұрақтары жоқ! Мұғалім берген дұрыс сілтеме арқылы кіріңіз.");
        return;
    }

    let targetCount = parseInt(localStorage.getItem('quiz_q_count')) || quizConfig.qCount;
    let targetMinutes = parseInt(localStorage.getItem('quiz_time_minutes')) || quizConfig.tMinutes;

    let takeCount = Math.min(targetCount, questions.length);
    let shuffled = questions.slice().sort(function() { return 0.5 - Math.random(); });
    currentQuizQuestions = shuffled.slice(0, takeCount);

    currentQuizIdx = 0;
    quizScore = 0;
    studentAnswers = [];
    quizTimeLeft = targetMinutes * 60;

    let loginBox = document.getElementById('student-login-box');
    let quizBox = document.getElementById('interactive-quiz-box');
    let greeting = document.getElementById('student-greeting');

    if (loginBox) loginBox.style.display = 'none';
    if (quizBox) quizBox.style.display = 'block';
    if (greeting) greeting.innerText = "Қатысушы: " + currentStudentName;

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
    if (!container) return;

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

function endInteractiveQuiz(message) {
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

    if (container) {
        container.innerHTML = '<div style="text-align: center; padding: 10px;">' +
                             '<h3>🎉 ' + message + '</h3>' +
                             '<p style="font-size: 18px; margin-top: 10px;">Сіздің ұпайыңыз:</p>' +
                             '<p style="font-size: 32px; font-weight: bold; color: #27ae60;">' + quizScore + ' / ' + totalQ + '</p>' +
                             '</div>';
    }
}
