let questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];

document.addEventListener('DOMContentLoaded', function() {
    renderQuestions();
    renderResults();
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

function addQuestions() {
    let input = document.getElementById('questionInput');
    if (!input) return;
    let text = input.value.trim();
    
    if (text !== "") {
        let blocks = text.split(/\n\s*\n/);
        
        blocks.forEach(block => {
            let trimmedBlock = block.trim();
            if (trimmedBlock !== "") {
                questions.push(trimmedBlock);
            }
        });

        input.value = "";
        renderQuestions();
        alert("Сұрақтар базаға сәтті қосылды!");
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        renderQuestions();
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
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
    if (confirm("Барлық оқушы нәтижелерін өшіргіңіз келе ме?")) {
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

    localStorage.setItem('quiz_q_count', qPerVariant);
    localStorage.setItem('quiz_time_minutes', testMinutes);

    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Базада ешқандай сұрақ жоқ! Алдымен сұрақтарды қосыңыз.");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Қате: Базада барлығы " + questions.length + " сұрақ қана бар. Сіз " + qPerVariant + " сұрақ сұрап тұрсыз!");
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
    if (actionButtons) {
        actionButtons.style.display = "flex";
    }
    
    alert("Мәліметтер сақталды! Оқушылар енді дәл " + qPerVariant + " сұрақ және " + testMinutes + " минут уақыт алады.");
}

function copyToClipboard() {
    let outputText = document.getElementById('output').innerText;
    navigator.clipboard.writeText(outputText).then(() => {
        alert("Барлық варианттар буферге көшірілді!");
    }).catch(err => {
        alert("Көшіру кезінде қате шықты: " + err);
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
        alert("Өтініш, аты-жөніңізді енгізіңіз!");
        return;
    }

    questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];

    if (questions.length === 0) {
        alert("Әзірге тест сұрақтары жоқ. Мұғалімнің сұрақ қосуын күтіңіз!");
        return;
    }

    let targetCount = parseInt(localStorage.getItem('quiz_q_count')) || 5;
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
        endInteractiveQuiz("Тест сәтті аяқталды!");
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
        
        if (isCorrect) {
            correctOptionLetter = optLetter;
        }

        html += '<label style="display:block; margin-bottom: 8px; cursor:pointer; padding: 8px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">' +
                '<input type="radio" name="student_answer" value="' + optLetter + '" style="margin-right: 10px;"> ' + 
                cleanOpt + '</label>';
    });

    html += '</div>';
    container.innerHTML = html;
    container.dataset.correctOption = correctOptionLetter;
}

function nextInteractiveQuestion() {
    let radios = document.getElementsByName('student_answer');
    let selectedVal = "";
    
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            selectedVal = radios[i].value;
            break;
        }
    }

    if (selectedVal === "") {
        alert("Өтініш, жауаптардың бірін таңдаңыз!");
        return;
    }

    let container = document.getElementById('quiz-question-container');
    let correctOpt = container.dataset.correctOption;

    let isCorrect = (selectedVal.toUpperCase() === correctOpt.toUpperCase());
    if (isCorrect) {
        quizScore++;
    }

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

    let reviewHtml = '<div style="text-align: center; padding: 10px;">' +
                     '<h3>🎉 ' + message + '</h3>' +
                     '<p style="font-size: 18px; margin-top: 10px;">Сіздің жинаған ұпайыңыз:</p>' +
                     '<p style="font-size: 32px; font-weight: bold; color: #27ae60;">' + quizScore + ' / ' + totalQ + '</p>' +
                     '</div><hr style="margin: 15px 0;"><h4 style="margin-bottom:10px;">Жауаптарды талдау:</h4>' +
                     '<div style="text-align: left; max-height: 320px; overflow-y: auto;">';

    studentAnswers.forEach((ans) => {
        let statusColor = ans.isCorrect ? '#27ae60' : '#e74c3c';
        let statusText = ans.isCorrect ? 'Дұрыс ✅' : 'Қате ❌';
        
        reviewHtml += '<div style="background: #fff; padding: 10px; margin-bottom: 8px; border-radius: 6px; border-left: 5px solid ' + statusColor + '; border: 1px solid #ddd;">' +
                      '<p><strong>' + ans.questionNum + '-сұрақ:</strong></p>' +
                      '<p style="font-size: 13px; color: #555; white-space: pre-line; margin: 5px 0;">' + ans.questionText.replace(/\*/g, '') + '</p>' +
                      '<p style="margin-top: 5px; font-size: 14px;">Сіздің жауабыңыз: <strong>' + ans.selected + '</strong> | Дұрыс жауап: <strong>' + ans.correct + '</strong> — <span style="color: ' + statusColor + '; font-weight: bold;">' + statusText + '</span></p>' +
                      '</div>';
    });

    reviewHtml += '</div>';
    container.innerHTML = reviewHtml;
}
