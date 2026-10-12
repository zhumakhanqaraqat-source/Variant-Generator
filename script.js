// GitHub-тағы ортақ questions.json файлының сілтемесі
const JSON_URL = 'https://raw.githubusercontent.com/zhumakhanqaraqat-source/Variant-Generator/main/questions.json';

let questions = [];

// Бет ашылғанда сұрақтарды жүктеп алу
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsFromCloud();
});

// Бұлттан (GitHub-тан) сұрақтарды оқып алу
function loadQuestionsFromCloud() {
    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            questions = data;
            renderQuestions();
        })
        .catch(err => {
            console.log("Сұрақтарды жүктеу қатесі:", err);
            questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
            renderQuestions();
        });
}

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i] + '</div> <button class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
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
        saveAndSync();
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        saveAndSync();
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    saveAndSync();
}

function saveAndSync() {
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
    renderQuestions();
    
    // JSON форматындағы көшірмесін шығарып беру (GitHub-тағы questions.json файлына салу үшін)
    let jsonString = JSON.stringify(questions, null, 2);
    console.log("Жаңартылған JSON:", jsonString);
    
    alert("Сұрақтар сақталды! Мұғалім панелі үшін дайын.");
}

// --- Вариант жасау функциялары (teacher.html үшін) ---
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
            html += '<li>' + selected[j] + '</li>';
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

// --- Оқушыларға арналған интерактивті тест режимі (index.html үшін) ---
let currentQuizQuestions = [];
let currentQuizIdx = 0;
let quizTimer;
let quizTimeLeft = 120; // 2 минут

function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    let studentName = nameInput ? nameInput.value.trim() : "";

    if (studentName === "") {
        alert("Өтініш, аты-жөніңізді енгізіңіз!");
        return;
    }

    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            questions = data.length > 0 ? data : (JSON.parse(localStorage.getItem('my_quiz_questions')) || []);
            
            if (questions.length === 0) {
                alert("Әзірге тест сұрақтары жоқ. Мұғалімнің қосуын күтіңіз!");
                return;
            }

            document.getElementById('student-login-box').style.display = 'none';
            document.getElementById('interactive-quiz-box').style.display = 'block';
            document.getElementById('student-greeting').innerText = "Қатысушы: " + studentName;

            currentQuizQuestions = questions.slice().sort(function() { return 0.5 - Math.random(); });
            if (currentQuizQuestions.length > 5) {
                currentQuizQuestions = currentQuizQuestions.slice(0, 5);
            }

            currentQuizIdx = 0;
            quizTimeLeft = 120;

            showInteractiveQuestion();
            startQuizTimer();
        })
        .catch(err => {
            alert("Сұрақтарды жүктеу кезінде қате шықты. Интернет байланысын тексеріңіз.");
        });
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

    let qBlock = currentQuizQuestions[currentQuizIdx];
    let container = document.getElementById('quiz-question-container');
    
    container.innerHTML = '<p><strong>' + (currentQuizIdx + 1) + '-сұрақ:</strong></p>' +
                          '<div style="white-space: pre-line; margin-bottom: 15px;">' + qBlock + '</div>';
}

function nextInteractiveQuestion() {
    currentQuizIdx++;
    showInteractiveQuestion();
}

function endInteractiveQuiz(message) {
    let container = document.getElementById('quiz-question-container');
    let nextBtn = document.getElementById('next-quiz-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    clearInterval(quizTimer);

    container.innerHTML = '<h3>🎉 ' + message + '</h3>' +
                          '<p>Барлық сұрақтар қаралып шықты. Қатысқаныңызға рақмет!</p>';
}
// GitHub-тағы ортақ questions.json файлының сілтемесі
const JSON_URL = 'https://raw.githubusercontent.com/zhumakhanqaraqat-source/Variant-Generator/main/questions.json';

let questions = [];

// Бет ашылғанда сұрақтарды жүктеп алу
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsFromCloud();
});

// Бұлттан (GitHub-тан) сұрақтарды оқып алу
function loadQuestionsFromCloud() {
    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            questions = data;
            renderQuestions();
        })
        .catch(err => {
            console.log("Сұрақтарды жүктеу қатесі:", err);
            questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
            renderQuestions();
        });
}

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i] + '</div> <button class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
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
        saveAndSync();
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        saveAndSync();
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    saveAndSync();
}

function saveAndSync() {
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
    renderQuestions();
    
    // JSON форматындағы көшірмесін шығарып беру (GitHub-тағы questions.json файлына салу үшін)
    let jsonString = JSON.stringify(questions, null, 2);
    console.log("Жаңартылған JSON:", jsonString);
    
    alert("Сұрақтар сақталды! Мұғалім панелі үшін дайын.");
}

// --- Вариант жасау функциялары (teacher.html үшін) ---
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
            html += '<li>' + selected[j] + '</li>';
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

// --- Оқушыларға арналған интерактивті тест режимі (index.html үшін) ---
let currentQuizQuestions = [];
let currentQuizIdx = 0;
let quizTimer;
let quizTimeLeft = 120; // 2 минут

function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    let studentName = nameInput ? nameInput.value.trim() : "";

    if (studentName === "") {
        alert("Өтініш, аты-жөніңізді енгізіңіз!");
        return;
    }

    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            questions = data.length > 0 ? data : (JSON.parse(localStorage.getItem('my_quiz_questions')) || []);
            
            if (questions.length === 0) {
                alert("Әзірге тест сұрақтары жоқ. Мұғалімнің қосуын күтіңіз!");
                return;
            }

            document.getElementById('student-login-box').style.display = 'none';
            document.getElementById('interactive-quiz-box').style.display = 'block';
            document.getElementById('student-greeting').innerText = "Қатысушы: " + studentName;

            currentQuizQuestions = questions.slice().sort(function() { return 0.5 - Math.random(); });
            if (currentQuizQuestions.length > 5) {
                currentQuizQuestions = currentQuizQuestions.slice(0, 5);
            }

            currentQuizIdx = 0;
            quizTimeLeft = 120;

            showInteractiveQuestion();
            startQuizTimer();
        })
        .catch(err => {
            alert("Сұрақтарды жүктеу кезінде қате шықты. Интернет байланысын тексеріңіз.");
        });
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

    let qBlock = currentQuizQuestions[currentQuizIdx];
    let container = document.getElementById('quiz-question-container');
    
    container.innerHTML = '<p><strong>' + (currentQuizIdx + 1) + '-сұрақ:</strong></p>' +
                          '<div style="white-space: pre-line; margin-bottom: 15px;">' + qBlock + '</div>';
}

function nextInteractiveQuestion() {
    currentQuizIdx++;
    showInteractiveQuestion();
}

function endInteractiveQuiz(message) {
    let container = document.getElementById('quiz-question-container');
    let nextBtn = document.getElementById('next-quiz-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    clearInterval(quizTimer);

    container.innerHTML = '<h3>🎉 ' + message + '</h3>' +
                          '<p>Барлық сұрақтар қаралып шықты. Қатысқаныңызға рақмет!</p>';
}
// GitHub-тағы ортақ questions.json файлының сілтемесі
const JSON_URL = 'https://raw.githubusercontent.com/zhumakhanqaraqat-source/Variant-Generator/main/questions.json';

let questions = [];

// Бет ашылғанда сұрақтарды жүктеп алу
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsFromCloud();
});

// Бұлттан (GitHub-тан) сұрақтарды оқып алу
function loadQuestionsFromCloud() {
    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            questions = data;
            renderQuestions();
        })
        .catch(err => {
            console.log("Сұрақтарды жүктеу қатесі:", err);
            questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
            renderQuestions();
        });
}

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i] + '</div> <button class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
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
        saveAndSync();
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        saveAndSync();
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    saveAndSync();
}

function saveAndSync() {
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
    renderQuestions();
    
    // JSON форматындағы көшірмесін шығарып беру (GitHub-тағы questions.json файлына салу үшін)
    let jsonString = JSON.stringify(questions, null, 2);
    console.log("Жаңартылған JSON:", jsonString);
    
    alert("Сұрақтар сақталды! Мұғалім панелі үшін дайын.");
}

// --- Вариант жасау функциялары (teacher.html үшін) ---
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
            html += '<li>' + selected[j] + '</li>';
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

// --- Оқушыларға арналған интерактивті тест режимі (index.html үшін) ---
let currentQuizQuestions = [];
let currentQuizIdx = 0;
let quizTimer;
let quizTimeLeft = 120; // 2 минут

function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    let studentName = nameInput ? nameInput.value.trim() : "";

    if (studentName === "") {
        alert("Өтініш, аты-жөніңізді енгізіңіз!");
        return;
    }

    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            questions = data.length > 0 ? data : (JSON.parse(localStorage.getItem('my_quiz_questions')) || []);
            
            if (questions.length === 0) {
                alert("Әзірге тест сұрақтары жоқ. Мұғалімнің қосуын күтіңіз!");
                return;
            }

            document.getElementById('student-login-box').style.display = 'none';
            document.getElementById('interactive-quiz-box').style.display = 'block';
            document.getElementById('student-greeting').innerText = "Қатысушы: " + studentName;

            currentQuizQuestions = questions.slice().sort(function() { return 0.5 - Math.random(); });
            if (currentQuizQuestions.length > 5) {
                currentQuizQuestions = currentQuizQuestions.slice(0, 5);
            }

            currentQuizIdx = 0;
            quizTimeLeft = 120;

            showInteractiveQuestion();
            startQuizTimer();
        })
        .catch(err => {
            alert("Сұрақтарды жүктеу кезінде қате шықты. Интернет байланысын тексеріңіз.");
        });
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

    let qBlock = currentQuizQuestions[currentQuizIdx];
    let container = document.getElementById('quiz-question-container');
    
    container.innerHTML = '<p><strong>' + (currentQuizIdx + 1) + '-сұрақ:</strong></p>' +
                          '<div style="white-space: pre-line; margin-bottom: 15px;">' + qBlock + '</div>';
}

function nextInteractiveQuestion() {
    currentQuizIdx++;
    showInteractiveQuestion();
}

function endInteractiveQuiz(message) {
    let container = document.getElementById('quiz-question-container');
    let nextBtn = document.getElementById('next-quiz-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    clearInterval(quizTimer);

    container.innerHTML = '<h3>🎉 ' + message + '</h3>' +
                          '<p>Барлық сұрақтар қаралып шықты. Қатысқаныңызға рақмет!</p>';
}
// GitHub-тағы ортақ questions.json файлының сілтемесі
const JSON_URL = 'https://raw.githubusercontent.com/zhumakhanqaraqat-source/Variant-Generator/main/questions.json';

let questions = [];

// Бет ашылғанда сұрақтарды жүктеп алу
document.addEventListener('DOMContentLoaded', function() {
    loadQuestionsFromCloud();
});

// Бұлттан (GitHub-тан) сұрақтарды оқып алу
function loadQuestionsFromCloud() {
    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(response => response.json())
        .then(data => {
            questions = data;
            renderQuestions();
        })
        .catch(err => {
            console.log("Сұрақтарды жүктеу қатесі:", err);
            questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
            renderQuestions();
        });
}

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i] + '</div> <button class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
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
        saveAndSync();
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

function clearAllQuestions() {
    if (confirm("Барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        saveAndSync();
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    saveAndSync();
}

function saveAndSync() {
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));
    renderQuestions();
    
    // JSON форматындағы көшірмесін шығарып беру (GitHub-тағы questions.json файлына салу үшін)
    let jsonString = JSON.stringify(questions, null, 2);
    console.log("Жаңартылған JSON:", jsonString);
    
    alert("Сұрақтар сақталды! Мұғалім панелі үшін дайын.");
}

// --- Вариант жасау функциялары (teacher.html үшін) ---
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
            html += '<li>' + selected[j] + '</li>';
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

// --- Оқушыларға арналған интерактивті тест режимі (index.html үшін) ---
let currentQuizQuestions = [];
let currentQuizIdx = 0;
let quizTimer;
let quizTimeLeft = 120; // 2 минут

function startInteractiveQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    let studentName = nameInput ? nameInput.value.trim() : "";

    if (studentName === "") {
        alert("Өтініш, аты-жөніңізді енгізіңіз!");
        return;
    }

    fetch(JSON_URL + '?t=' + new Date().getTime())
        .then(res => res.json())
        .then(data => {
            questions = data.length > 0 ? data : (JSON.parse(localStorage.getItem('my_quiz_questions')) || []);
            
            if (questions.length === 0) {
                alert("Әзірге тест сұрақтары жоқ. Мұғалімнің қосуын күтіңіз!");
                return;
            }

            document.getElementById('student-login-box').style.display = 'none';
            document.getElementById('interactive-quiz-box').style.display = 'block';
            document.getElementById('student-greeting').innerText = "Қатысушы: " + studentName;

            currentQuizQuestions = questions.slice().sort(function() { return 0.5 - Math.random(); });
            if (currentQuizQuestions.length > 5) {
                currentQuizQuestions = currentQuizQuestions.slice(0, 5);
            }

            currentQuizIdx = 0;
            quizTimeLeft = 120;

            showInteractiveQuestion();
            startQuizTimer();
        })
        .catch(err => {
            alert("Сұрақтарды жүктеу кезінде қате шықты. Интернет байланысын тексеріңіз.");
        });
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

    let qBlock = currentQuizQuestions[currentQuizIdx];
    let container = document.getElementById('quiz-question-container');
    
    container.innerHTML = '<p><strong>' + (currentQuizIdx + 1) + '-сұрақ:</strong></p>' +
                          '<div style="white-space: pre-line; margin-bottom: 15px;">' + qBlock + '</div>';
}

function nextInteractiveQuestion() {
    currentQuizIdx++;
    showInteractiveQuestion();
}

function endInteractiveQuiz(message) {
    let container = document.getElementById('quiz-question-container');
    let nextBtn = document.getElementById('next-quiz-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    clearInterval(quizTimer);

    container.innerHTML = '<h3>🎉 ' + message + '</h3>' +
                          '<p>Барлық сұрақтар қаралып шықты. Қатысқаныңызға рақмет!</p>';
}
