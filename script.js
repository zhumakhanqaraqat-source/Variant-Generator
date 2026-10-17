let questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];

document.addEventListener('DOMContentLoaded', function() {
    renderQuestions();
    renderResults();
    setupNavigation();
    setupGameModule();
    setupTestModule();
    setupGroupingModule();
    setupStudentQuizModule();
});

// Navigation / Tabs
function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) targetTab.classList.add('active');

    const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
    if (targetBtn) targetBtn.classList.add('active');
}

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });
}

// 1. Test Base Module
function renderQuestions() {
    let list = document.getElementById('questionsList');
    let total = document.getElementById('totalQuestions');
    localStorage.setItem('my_quiz_questions', JSON.stringify(questions));

    if (total) total.innerText = questions.length;
    if (list) {
        list.innerHTML = "";
        questions.forEach((q, i) => {
            let cleanText = q.replace(/\*/g, '').split('\n')[0];
            list.innerHTML += `<li><span><strong>${i+1}.</strong> ${cleanText}</span> <button class="btn-danger" onclick="deleteQuestion(${i})">Өшіру</button></li>`;
        });
    }
}

function setupTestModule() {
    document.getElementById('addQuestionBtn').addEventListener('click', () => {
        let input = document.getElementById('questionInput');
        let text = input.value.trim();
        if (text) {
            text.split(/\n\s*\n/).forEach(b => { if(b.trim()) questions.push(b.trim()); });
            input.value = "";
            renderQuestions();
            alert("Сұрақтар базаға қосылды!");
        } else {
            alert("Сұрақ жазыңыз!");
        }
    });

    document.getElementById('clearQuestionsBtn').addEventListener('click', () => {
        if(confirm("Барлық сұрақтарды өшіресіз бе?")) {
            questions = [];
            renderQuestions();
        }
    });

    document.getElementById('generateVariantsBtn').addEventListener('click', generateVariants);
    document.getElementById('clearResultsBtn').addEventListener('click', clearResults);
    document.getElementById('printBtn').addEventListener('click', () => window.print());
    document.getElementById('copyBtn').addEventListener('click', copyVariantsToClipboard);
}

function deleteQuestion(i) {
    questions.splice(i, 1);
    renderQuestions();
}

function generateVariants() {
    let vCount = parseInt(document.getElementById('variantCount').value) || 1;
    let qPerV = parseInt(document.getElementById('questionsPerVariant').value) || 1;
    let tMin = parseInt(document.getElementById('testTimeMinutes').value) || 10;
    let output = document.getElementById('output');

    localStorage.setItem('quiz_q_count', qPerV);
    localStorage.setItem('quiz_time_minutes', tMin);
    output.innerHTML = "";

    if (questions.length === 0) { alert("Базада сұрақ жоқ!"); return; }
    if (qPerV > questions.length) { alert("Базадағы сұрақ саны жеткіліксіз!"); return; }

    for (let i = 1; i <= vCount; i++) {
        let shuffled = [...questions].sort(() => 0.5 - Math.random()).slice(0, qPerV);
        let html = `<div class="variant-box"><div class="variant-title">Вариант №${i}</div><ol>`;
        shuffled.forEach(q => html += `<li>${q.replace(/\*/g, '')}</li>`);
        html += `</ol></div>`;
        output.innerHTML += html;
    }
    document.getElementById('actionButtons').style.display = "flex";
}

function copyVariantsToClipboard() {
    navigator.clipboard.writeText(document.getElementById('output').innerText).then(() => alert("Көшірілді!"));
}

function renderResults() {
    let tbody = document.getElementById('resultsTableBody');
    if (!tbody) return;
    let results = JSON.parse(localStorage.getItem('student_results')) || [];
    if (results.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #777;">Нәтижелер жоқ</td></tr>';
        return;
    }
    tbody.innerHTML = results.map((r, i) => `<tr><td>${i+1}</td><td><strong>${r.name}</strong></td><td style="color:#10b981; font-weight:bold;">${r.score} / ${r.total}</td><td style="font-size:12px; color:#64748b;">${r.date}</td></tr>`).join('');
}

function clearResults() {
    if(confirm("Нәтижелерді тазалау?")) {
        localStorage.removeItem('student_results');
        renderResults();
    }
}

// 2. Games Module (5 Games)
let gameData = [];
let currentGameIdx = 0;
let bombTimerInterval;

function setupGameModule() {
    document.getElementById('addGameFieldBtn').addEventListener('click', () => {
        let container = document.getElementById('game-questions-container');
        let count = container.querySelectorAll('.game-input-row').length + 1;
        let div = document.createElement('div');
        div.className = 'game-input-row';
        div.innerHTML = `<input type="text" class="g-q-input" placeholder="${count}-сұрақ"><input type="text" class="g-a-input" placeholder="Жауабы">`;
        container.appendChild(div);
    });

    document.querySelectorAll('.game-select-btn').forEach(btn => {
        btn.addEventListener('click', () => startSelectedGame(btn.getAttribute('data-game')));
    });

    document.getElementById('closePlayground').addEventListener('click', () => {
        document.getElementById('gamePlayground').style.display = 'none';
        clearInterval(bombTimerInterval);
    });

    document.getElementById('spinWheelBtn').addEventListener('click', spinWheel);
    document.getElementById('flashCardElement').addEventListener('click', function() { this.classList.toggle('flipped'); });
    document.getElementById('nextFcBtn').addEventListener('click', nextFlashcard);
    document.getElementById('showBombAnsBtn').addEventListener('click', () => document.getElementById('bombA').style.display = 'block');
    document.getElementById('nextBombBtn').addEventListener('click', startBombGame);
}

function collectGameData() {
    gameData = [];
    document.querySelectorAll('.game-input-row').forEach(row => {
        let q = row.querySelector('.g-q-input').value.trim();
        let a = row.querySelector('.g-a-input').value.trim();
        if (q) gameData.push({ q, a: a || "Жауап көрсетілмеген" });
    });
    return gameData.length > 0;
}

function startSelectedGame(type) {
    if (!collectGameData()) { alert("Кем дегенде 1 сұрақ жазыңыз!"); return; }
    
    document.getElementById('gamePlayground').style.display = 'block';
    document.querySelectorAll('.sub-game').forEach(el => el.style.display = 'none');
    let title = document.getElementById('gameTitle').value.trim() || "Ойын";
    document.getElementById('playgroundTitle').innerText = title;

    if (type === 'wheel') {
        document.getElementById('sub-wheel').style.display = 'block';
        document.getElementById('wheelResult').innerText = "";
    } else if (type === 'flashcard') {
        document.getElementById('sub-flashcard').style.display = 'block';
        currentGameIdx = 0;
        showFlashcard();
    } else if (type === 'match') {
        document.getElementById('sub-match').style.display = 'block';
        initMatchGame();
    } else if (type === 'bomb') {
        document.getElementById('sub-bomb').style.display = 'block';
        currentGameIdx = 0;
        startBombGame();
    } else if (type === 'quiz') {
        document.getElementById('sub-quiz').style.display = 'block';
        currentGameIdx = 0;
        showQuizGame();
    }
}

// 1. Wheel
function spinWheel() {
    let circle = document.getElementById('wheelCircle');
    let deg = 3600 + Math.floor(Math.random() * 360);
    circle.style.transform = `rotate(${deg}deg)`;
    document.getElementById('wheelResult').innerText = "Айналуда... 🌀";
    setTimeout(() => {
        let picked = gameData[Math.floor(Math.random() * gameData.length)];
        document.getElementById('wheelResult').innerHTML = `Сұрақ: <br><b>${picked.q}</b>`;
    }, 4000);
}

// 2. Flashcard
function showFlashcard() {
    let item = gameData[currentGameIdx];
    document.getElementById('fcQText').innerText = item.q;
    document.getElementById('fcAText').innerText = item.a;
    document.getElementById('flashCardElement').classList.remove('flipped');
}
function nextFlashcard() {
    currentGameIdx = (currentGameIdx + 1) % gameData.length;
    showFlashcard();
}

// 3. Match Game
let firstMatch = null;
function initMatchGame() {
    let grid = document.getElementById('matchGrid');
    grid.innerHTML = "";
    firstMatch = null;
    let items = [];
    gameData.forEach((d, idx) => {
        items.push({ text: d.q, id: idx });
        items.push({ text: d.a, id: idx });
    });
    items.sort(() => 0.5 - Math.random());
    items.forEach(it => {
        let div = document.createElement('div');
        div.className = 'match-item';
        div.innerText = it.text;
        div.dataset.id = it.id;
        div.onclick = function() {
            if (this.classList.contains('matched')) return;
            if (!firstMatch) {
                firstMatch = this;
                this.classList.add('selected');
            } else if (firstMatch === this) {
                this.classList.remove('selected');
                firstMatch = null;
            } else {
                if (firstMatch.dataset.id === this.dataset.id) {
                    firstMatch.classList.add('matched');
                    this.classList.add('matched');
                    firstMatch = null;
                } else {
                    this.classList.add('selected');
                    setTimeout(() => {
                        firstMatch.classList.remove('selected');
                        this.classList.remove('selected');
                        firstMatch = null;
                    }, 500);
                }
            }
        };
        grid.appendChild(div);
    });
}

// 4. Bomb
function startBombGame() {
    clearInterval(bombTimerInterval);
    let item = gameData[currentGameIdx];
    document.getElementById('bombQ').innerText = `${currentGameIdx+1}. ${item.q}`;
    document.getElementById('bombA').innerText = `Жауабы: ${item.a}`;
    document.getElementById('bombA').style.display = 'none';
    
    let time = 10;
    document.getElementById('bombTimer').innerText = time;
    bombTimerInterval = setInterval(() => {
        time--;
        document.getElementById('bombTimer').innerText = time;
        if(time <= 0) {
            clearInterval(bombTimerInterval);
            document.getElementById('bombTimer').innerText = "💥 БУМ!";
            document.getElementById('bombA').style.display = 'block';
        }
    }, 1000);
}

// 5. Quiz
function showQuizGame() {
    let item = gameData[currentGameIdx];
    document.getElementById('quizQ').innerText = `${currentGameIdx+1}. ${item.q}`;
    let optsContainer = document.getElementById('quizOptions');
    document.getElementById('quizFeedback').innerText = "";
    optsContainer.innerHTML = "";

    let opts = [item.a, "Қате жауап 1", "Қате жауап 2", "Қате жауап 3"].sort(() => 0.5 - Math.random());
    opts.forEach(opt => {
        let btn = document.createElement('button');
        btn.className = 'btn-secondary quiz-opt-btn';
        btn.innerText = opt;
        btn.onclick = function() {
            if(opt === item.a) {
                btn.style.background = "#10b981"; btn.style.color = "white";
                document.getElementById('quizFeedback').innerHTML = "<span style='color:#10b981'>Дұрыс! 🎉</span>";
            } else {
                btn.style.background = "#ef4444"; btn.style.color = "white";
                document.getElementById('quizFeedback').innerHTML = `<span style='color:#ef4444'>Қате! Дұрысы: ${item.a}</span>`;
            }
            setTimeout(() => {
                currentGameIdx = (currentGameIdx + 1) % gameData.length;
                showQuizGame();
            }, 1400);
        };
        optsContainer.appendChild(btn);
    });
}

// 3. Grouping Module
function setupGroupingModule() {
    document.getElementById('divideGroupsBtn').addEventListener('click', () => {
        let text = document.getElementById('studentsListInput').value.trim();
        let area = document.getElementById('groupsResultArea');
        let count = parseInt(document.getElementById('groupCount').value) || 2;
        let method = document.getElementById('groupMethod').value;

        let students = text.split('\n').map(s => s.trim()).filter(Boolean);
        if (students.length === 0) { alert("Оқушылар тізімін енгізіңіз!"); return; }

        let groups = Array.from({ length: count }, () => []);
        let shuffled = [...students].sort(() => 0.5 - Math.random());

        shuffled.forEach((st, idx) => groups[idx % count].push(st));

        area.innerHTML = groups.map((g, idx) => `
            <div class="group-card">
                <h4>🔹 ${idx+1}-топ (${g.length})</h4>
                <ol style="margin:0; padding-left:18px;">${g.map(s => `<li>${s}</li>`).join('')}</ol>
            </div>
        `).join('');
    });
}

// 4. Student Quiz Module
let curQuizList = [], curQuizIdx = 0, curScore = 0, studentAnswers = [], studentName = "", quizTimerInterval, timeLeft = 0;

function setupStudentQuizModule() {
    document.getElementById('startQuizBtn').addEventListener('click', startStudentQuiz);
    document.getElementById('nextQuizBtn').addEventListener('click', nextStudentQuiz);
}

function startStudentQuiz() {
    let nameInput = document.getElementById('studentNameInput');
    studentName = nameInput ? nameInput.value.trim() : "";
    if (!studentName) { alert("Аты-жөніңізді енгізіңіз!"); return; }

    questions = JSON.parse(localStorage.getItem('my_quiz_questions')) || [];
    if (questions.length === 0) { alert("Тест сұрақтары әзірленбеген!"); return; }

    let targetCount = parseInt(localStorage.getItem('quiz_q_count')) || 5;
    let targetMin = parseInt(localStorage.getItem('quiz_time_minutes')) || 10;

    curQuizList = [...questions].sort(() => 0.5 - Math.random()).slice(0, targetCount);
    curQuizIdx = 0;
    curScore = 0;
    studentAnswers = [];
    timeLeft = targetMin * 60;

    document.getElementById('student-login-box').style.display = 'none';
    document.getElementById('interactive-quiz-box').style.display = 'block';
    document.getElementById('student-greeting').innerText = `Қатысушы: ${studentName}`;

    showStudentQuestion();
    startStudentTimer();
}

function startStudentTimer() {
    clearInterval(quizTimerInterval);
    quizTimerInterval = setInterval(() => {
        timeLeft--;
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        let timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) timerDisplay.innerText = `⏱️ ${m}:${s < 10 ? '0':''}${s}`;
        if (timeLeft <= 0) {
            clearInterval(quizTimerInterval);
            finishStudentQuiz("Уақыт бітті!");
        }
    }, 1000);
}

function showStudentQuestion() {
    if (curQuizIdx >= curQuizList.length) {
        clearInterval(quizTimerInterval);
        finishStudentQuiz("Тест аяқталды!");
        return;
    }

    let fullText = curQuizList[curQuizIdx];
    let lines = fullText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let qTitle = lines[0];
    let opts = lines.slice(1);

    let container = document.getElementById('quiz-question-container');
    let correctLet = "";

    let html = `<p><strong>${curQuizIdx+1}-сұрақ:</strong> ${qTitle}</p><div style="margin: 12px 0;">`;
    opts.forEach(opt => {
        let isCor = opt.startsWith('*');
        let clean = isCor ? opt.substring(1).trim() : opt;
        let lettr = clean.charAt(0).toUpperCase();
        if (isCor) correctLet = lettr;

        html += `<label style="display:block; margin-bottom:6px; cursor:pointer; background:#fff; padding:8px; border-radius:6px; border:1px solid #e2e8f0;">
            <input type="radio" name="st_ans" value="${lettr}"> ${clean}
        </label>`;
    });
    html += `</div>`;
    container.innerHTML = html;
    container.dataset.correct = correctLet;
}

function nextStudentQuiz() {
    let radios = document.getElementsByName('st_ans');
    let val = "";
    for (let r of radios) { if (r.checked) { val = r.value; break; } }

    if (!val) { alert("Жауапты таңдаңыз!"); return; }

    let container = document.getElementById('quiz-question-container');
    let cor = container.dataset.correct;
    let isCor = (val.toUpperCase() === cor.toUpperCase());
    if (isCor) curScore++;

    studentAnswers.push({ num: curQuizIdx+1, selected: val, correct: cor, isCor });
    curQuizIdx++;
    showStudentQuestion();
}

function finishStudentQuiz(msg) {
    clearInterval(quizTimerInterval);
    document.getElementById('nextQuizBtn').style.display = 'none';

    let total = curQuizList.length;
    let results = JSON.parse(localStorage.getItem('student_results')) || [];
    results.push({
        name: studentName,
        score: curScore,
        total: total,
        date: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
    });
    localStorage.setItem('student_results', JSON.stringify(results));
    renderResults();

    let container = document.getElementById('quiz-question-container');
    container.innerHTML = `
        <div style="text-align: center;">
            <h3>🎉 ${msg}</h3>
            <p>Нәтижеңіз:</p>
            <h1 style="color: #10b981; font-size: 36px; margin: 10px 0;">${curScore} / ${total}</h1>
        </div>
    `;
}
