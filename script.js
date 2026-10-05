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
        renderQuestions();
    } else {
        alert("Өтініш, сұрақтарды жазыңыз немесе көшіріп қойыңыз!");
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
