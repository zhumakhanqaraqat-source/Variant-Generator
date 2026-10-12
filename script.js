let questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];

document.addEventListener('DOMContentLoaded', function() {
    renderQuestions();
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

function generateVariants() {
    let variantCountInput = document.getElementById('variantCount');
    let qPerVariantInput = document.getElementById('questionsPerVariant');
    let output = document.getElementById('output');
    
    if (!output) return;

    let variantCount = parseInt(variantCountInput ? variantCountInput.value : 1);
    let qPerVariant = parseInt(qPerVariantInput ? qPerVariantInput.value : 1);

    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Базада ешқандай сұрақ жоқ! Алдымен сұрақтарды қосыңыз.");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Базада мұнша сұрақ жоқ! Базада бары: " + questions.length + " сұрақ.");
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
}

function copyToClipboard() {
    let outputText = document.getElementById('output').innerText;
    navigator.clipboard.writeText(outputText).then(() => {
        alert("Барлық варианттар буферге көшірілді!");
    }).catch(err => {
        alert("Көшіру кезінде қате шықты: " + err);
    });
}

// --- Оқушыларға арналған интерактивті тест (Толық түзетілген нұсқа) ---
let currentQuizQuestions = [];
let currentQuizIdx = 0;
let quizScore = 0;
let studentAnswers = []; // Оқушының берген жауаптарын сақтау үшін
let quizTimer;
let quizTimeLeft = 120;

function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    let studentName = nameInput ? nameInput.value.trim() : "";

    if (studentName === "") {
        alert("Өтініш, аты-жөніңізді енгізіңіз!");
        return;
    }

    questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];

    if (questions.length === 0) {
        alert("Әзірге тест сұрақтары жоқ. Мұғалімнің сұрақ қосуын күтіңіз!");
        return;
    }

    currentQuizQuestions = questions.slice().sort(function() { return 0.5 - Math.random(); });
    if (currentQuizQuestions.length > 5) {
        currentQuizQuestions = currentQuizQuestions.slice(0, 5);
    }

    currentQuizIdx = 0;
    quizScore = 0;
    studentAnswers = [];
    quizTimeLeft = 120;

    document.getElementById('student-login-box').style.display = 'none';
    document.getElementById('interactive-quiz-box').style.display = 'block';
    document.getElementById('student-greeting').innerText = "Қатысушы: " + studentName;

    showInteractiveQuestion();
    startQuizTimer();
}

function startQuizTimer() {
    let timerSpan = document.getElementById('time-left');
    clearInterval(quizTimer);
    quizTimer = setInterval(function() {
        quizTimeLeft--;
        if (timerSpan) timerSpan.innerText = quizTimeLeft;

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
    let lines = fullText.split('\n');
    let validLines = lines.filter(l => l.trim() !== "");
    
    let questionTitle = validLines[0]; // Сұрақтың өзі
    let options = validLines.slice(1); // A, B, C, D нұсқалары

    let container = document.getElementById('quiz-question-container');
    
    let html = '<p><strong>' + (currentQuizIdx + 1) + '-сұрақ:</strong> ' + questionTitle + '</p><div style="margin: 15px 0;">';

    let correctOptionLetter = "";

    options.forEach((opt, idx) => {
        let trimmedOpt = opt.trim();
        let isCorrect = trimmedOpt.startsWith('*');
        let cleanOpt = isCorrect ? trimmedOpt.substring(1).trim() : trimmedOpt;
        
        // Әр варианттың әрпін анықтау (A, B, C, D)
        let letterMatch = cleanOpt.match(/^([A-Za-zА-Яа-яӘәҒғҚқҢңӨөҰұҮүҺһІі])[\)\.]/);
        let optLetter = letterMatch ? letterMatch[1].toUpperCase() : String.fromCharCode(65 + idx);
        
        if (isCorrect) {
            correctOptionLetter = optLetter;
        }

        // Әр вариантқа жеке батырма (radio button) жасау
        html += '<label style="display:block; margin-bottom: 10px; cursor:pointer; padding: 10px; background: #fff; border: 1px solid #ccc; border-radius: 6px;">' +
                '<input type="radio" name="student_answer" value="' + optLetter + '" style="margin-right: 10px; transform: scale(1.2);"> ' + 
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

    // Оқушының жауабын тізімге сақтап қою (талдау үшін)
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

    // Нәтиже мен толық талдауды (ревью) шығару
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
