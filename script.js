// Сұрақтар сақталатын массив
let questions = [];

// Жаңа сұрақ қосу
function addQuestion() {
    let input = document.getElementById('questionInput');
    let text = input.value.trim();
    
    if (text !== "") {
        questions.push(text);
        input.value = "";
        renderQuestions();
    } else {
        alert("Өтініш, сұрақты жазыңыз!");
    }
}

// Тізімді экранға шығару
function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    
    total.innerText = questions.length;
    list.innerHTML = "";

    for (let i = 0; i < questions.length; i++) {
        list.innerHTML += '<li>' + (i + 1) + '. ' + questions[i] + ' <button class="btn-delete" onclick="deleteQuestion(' + i + ')">Өшіру 🗑️</button></li>';
    }
}

// Сұрақты өшіру
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
        alert("Базада ешқандай сұрақ жоқ! Алдымен сұрақ қосыңыз.");
        return;
    }

    if (qPerVariant > questions.length) {
        alert("Базада мұнша сұрақ жоқ! Көбірек сұрақ қосыңыз.");
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
