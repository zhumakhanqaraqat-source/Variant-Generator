// Авто-сақтау арқылы браузерде сақталған сұрақтарды жүктеп аламыз
let questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];

// Бет ашылғанда бірден базадағы сұрақтарды көрсету
document.addEventListener('DOMContentLoaded', renderQuestions);

// Сұрақтарды тізімге шығару және локальді сақтау
function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    // Блоктарды сақтап қою
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));

    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        for (let i = 0; i < questions.length; i++) {
            list.innerHTML += '<li><div class="question-text"><strong>' + (i + 1) + '.</strong> ' + questions[i] + '</div> <button class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️️</button></li>';
        }
    }
}

// Сұрақтарды топтап қосу
function addQuestions() {
    let input = document.getElementById('questionInput');
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
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

// Бір сұрақты өшіру
function deleteQuestion(index) {
    questions.splice(index, 1);
    renderQuestions();
}

// Барлық базаны тазалау
function clearAllQuestions() {
    if (confirm("Базадағы барлық сұрақтарды өшіргіңіз келе ме?")) {
        questions = [];
        renderQuestions();
    }
}

// Жауап варианттарын (A, B, C, D) араластыру функциясы
function shuffleAnswerOptions(questionText) {
    let lines = questionText.split('\n');
    let title = lines[0]; // Сұрақтың өзі (бірінші жолы)
    let options = lines.slice(1); // Жауап варианттары

    if (options.length <= 1) return questionText; // Варианттар болмаса, өзгеріссіз қайтарамыз

    // Варианттардың бастапқы әріптерін (A), B), C)) алып тастап, тазалаймыз
    let cleanOptions = options.map(opt => opt.replace(/^[A-Za-dА-Яа-я][\)\.]\s*/, '').trim()).filter(opt => opt !== "");

    // Араластырамыз
    cleanOptions.sort(() => 0.5 - Math.random());

    // Жаңадан A), B), C) әріптерін тіземіз
    let letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    let formattedOptions = cleanOptions.map((opt, idx) => letters[idx] + ') ' + opt);

    return title + '\n' + formattedOptions.join('\n');
}

// Варианттарды құрастыру
function generateVariants() {
    let variantCount = parseInt(document.getElementById('variantCount').value);
    let qPerVariant = parseInt(document.getElementById('questionsPerVariant').value);
    let shouldShuffleAnswers = document.getElementById('shuffleAnswers').checked;
    let output = document.getElementById('output');
    let actionButtons = document.getElementById('actionButtons');
    
    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Базада ешқандай сұрақ жоқ!");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Базада мұнша сұрақ жоқ! Бары: " + questions.length + " сұрақ.");
        return;
    }

    for (let i = 1; i <= variantCount; i++) {
        let shuffled = questions.slice().sort(() => 0.5 - Math.random());
        let selected = shuffled.slice(0, qPerVariant);

        let html = '<div class="variant-box"><div class="variant-title">📌 Вариант №' + i + '</div><ol>';
        for (let j = 0; j < selected.length; j++) {
            let qText = selected[j];
            if (shouldShuffleAnswers) {
                qText = shuffleAnswerOptions(qText);
            }
            html += '<li>' + qText + '</li>';
        }
        html += '</ol></div>';
        
        output.innerHTML += html;
    }

    // Басып шығару және Көшіру батырмаларын көрсету
    actionButtons.style.display = "flex";
}

// Нәтижені буферге (Clipboard) көшіру
function copyToClipboard() {
    let output = document.getElementById('output');
    if (!output.innerText) return;

    navigator.clipboard.writeText(output.innerText).then(() => {
        alert("Барлық варианттар көшірілді! Word-қа немесе WhatsApp-қа қоя (paste) аласыз.");
    }).catch(err => {
        alert("Көшіру кезінде қате шықты: " + err);
    });
}
