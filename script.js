let questions = [];

function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    if (total) {
        total.innerText = questions.length;
    }
    
    if (list) {
        list.innerHTML = "";
        questions.forEach((q, index) => {
            list.innerHTML += `
                <li>
                    <span>${index + 1}. ${q}</span>
                    <button class="btn-delete" onclick="deleteQuestion(${index})">Өшіру 🗑️</button>
                </li>
            `;
        });
    }
}

function addQuestion() {
    let input = document.getElementById('questionInput');
    if (!input) return;

    let text = input.value.trim();
    
    if (text !== "") {
        questions.push(text);
        renderQuestions();
        input.value = "";
    } else {
        alert("Сұрақты енгізіңіз!");
    }
}

function deleteQuestion(index) {
    questions.splice(index, 1);
    renderQuestions();
}

function generateVariants() {
    let variantCount = parseInt(document.getElementById('variantCount').value);
    let qPerVariant = parseInt(document.getElementById('questionsPerVariant').value);
    let output = document.getElementById('output');
    
    output.innerHTML = "";

    if (questions.length === 0) {
        alert("Базада ешқандай сұрақ жоқ! Алдымен сұрақ қосыңыз.");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Базада бұндай санға жететін сұрақ жоқ! Көбірек сұрақ қосыңыз.");
        return;
    }

    for (let i = 1; i <= variantCount; i++) {
        let shuffled = [...questions].sort(() => 0.5 - Math.random());
        let selectedQuestions = shuffled.slice(0, qPerVariant);

        let variantHTML = `<div class="variant-box">
            <div class="variant-title">📌 Вариант №${i}</div><ol>`;
        
        selectedQuestions.forEach(q => {
            variantHTML += `<li>${q}</li>`;
        });

        variantHTML += `</ol></div>`;
        output.innerHTML += variantHTML;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    renderQuestions();
});
