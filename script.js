let questions = [];

// Сұрақтар мен тесттерді тізімге шығару
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

// Тесттер мен сұрақтарды топтап қосу
function addQuestions() {
    let input = document.getElementById('questionInput');
    let text = input.value.trim();
    
    if (text !== "") {
        // Екі немесе одан да көп бос жол қалдырылған жерден тесттерді ажыратамыз
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
        alert("Өтініш, сұрақтар мен варианттарды жазыңыз немесе көшіріп қойыңыз!");
    }
}

// Таңдалған сұрақты/тестті өшіру
function deleteQuestion(index) {
    questions.splice(index, 1);
    renderQuestions();
}

// Варианттарды құрастыру
function generateVariants() {
    let variantCount = parseInt(document.getElementById('variantCount').value);
    let qPerVariant = parseInt(document.getElementById('questionsPerVariant').value);
    let output = document.getElementById('output');
    
    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Базада ешқандай сұрақ немесе тест жоқ! Алдымен тесттерді қосыңыз.");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Базада мұнша сұрақ жоқ! Базада бары: " + questions.length + " сұрақ/тест.");
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
}
