/*
    Курс: Vibe Coding
    Домашнее задание №3: Генератор отчёта по викторине
    Выполнил: Молчанов Константин
    Группа: М26-555
*/


// Готовая защитная механика. Не изменяйте эту функцию.
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// Фильтруем попытки в зависимости от выбранного значения
function selectAttempts(filter) {
    const attempts = window.reportData.attempts;

    // Если выбран фильтр "прошедшие", оставляем только тех, у кого passed === true
    if (filter === 'passed') {
        return attempts.filter(attempt => attempt.passed === true);
    }
    // Если "не прошедшие", оставляем тех, у кого passed === false
    if (filter === 'failed') {
        return attempts.filter(attempt => attempt.passed === false);
    }
    // Для "Все" просто возвращаем исходный массив
    return attempts;
}

// Функция для отрисовки списка попыток на странице
function renderAttempts(attempts) {
    let htmlString = '';

    // Собираем HTML-код через цикл forEach и аккумулятор (переменную htmlString)
    attempts.forEach(attempt => {
        const status = attempt.passed ? 'Порог пройден' : 'Порог не пройден';
        // Имя обязательно пропускаем через escapeHtml для безопасности
        htmlString += `<li class="result-item ${attempt.passed ? 'status-passed' : 'status-failed'}">
            <span class="result-name">${escapeHtml(attempt.name)}</span>
            <span class="result-score">${attempt.score} из ${attempt.questionCount} (${attempt.percentage}%) – ${status}</span>
        </li>`;
    });

    // Вставляем собранный HTML в список на странице
    document.querySelector('#result-list').innerHTML = htmlString;

    // Обновляем счетчик отображенных записей
    const totalCount = window.reportData.attempts.length;
    document.querySelector('#result-count').textContent = `Показано: ${attempts.length} из ${totalCount}`;
}

// Инициализируем форму фильтрации при загрузке страницы
function startFilter() {
    const form = document.querySelector('#filter-form');
    const select = document.querySelector('#filter');
    const resultCount = document.querySelector('#result-count');
    const resultList = document.querySelector('#result-list');

    if (!form || !select || !resultCount || !resultList) {
        return;
    }

    // Вешаем обработчик события submit на форму
    form.addEventListener('submit', (event) => {
        // Отменяем стандартное поведение (перезагрузку страницы)
        event.preventDefault();

        // Получаем выбранное значение и запускаем фильтрацию
        const filterValue = select.value;
        const filteredAttempts = selectAttempts(filterValue);

        // Отрисовываем результат
        renderAttempts(filteredAttempts);
    });
}

startFilter();
