let questions = [
    "5 + 7 = ?",
    "Квадраттың қабырғасы 4 см болса, ауданы неге тең?",
    "Дискриминант формуласын жазыңыз.",
    "12 / 3 * 2 неге тең?",
    "Үшбұрыштың ішкі бұрыштарының қосындысы қанша?",
    "x + 10 = 25 болса, x неге тең?"
];

document.getElementById('totalQuestions').innerText = questions.length;

function addQuestion() {
    let input = document.getElementById('questionInput');
    let text = input.value.trim();
    
    if (text !== "") {
        questions.push(text);
        document.getElementById('totalQuestions').innerText = questions.length;
        input.value = "";
        alert("Сұрақ базаға қосылды!");
    } else {
        alert("Сұрақты енгізіңіз!");
    }
}

function generateVariants() {
    let variantCount = parseInt(document.getElementById('variantCount').value);
    let qPerVariant = parseInt(document.getElementById('questionsPerVariant').value);
    let output = document.getElementById('output');
    
    output.innerHTML = "";

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
