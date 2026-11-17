const PASSING_PERCENTAGE = 67;

// Вспомогательная функция для проверки, является ли значение массивом. 
// Выносим ее отдельно, чтобы не дублировать код при проверках.
function isArray(value) {
    return Array.isArray(value);
}

// Функция валидации данных. Проверяем данные шаг за шагом, от общего к частному.
export function validateQuizData(data) {
    // 1. Сначала убеждаемся, что корень — это объект (не null и не массив)
    if (typeof data !== 'object' || data === null || isArray(data)) return false;

    // 2. Проверяем, что название викторины — непустая строка
    if (typeof data.quizTitle !== 'string' || data.quizTitle.trim() === '') return false;

    // 3. Убеждаемся, что массив с правильными ответами непустой
    if (!isArray(data.correctAnswers) || data.correctAnswers.length === 0) return false;

    // 4. Массив попыток также должен быть непустым
    if (!isArray(data.attempts) || data.attempts.length === 0) return false;

    // 5-7. Проходимся циклом по каждой попытке и проверяем её структуру
    for (let i = 0; i < data.attempts.length; i++) {
        const attempt = data.attempts[i];
        // Попытка должна быть объектом
        if (typeof attempt !== 'object' || attempt === null || isArray(attempt)) return false;
        // Имя должно быть строкой и не пустым после удаления пробелов
        if (typeof attempt.name !== 'string' || attempt.name.trim() === '') return false;
        // Количество ответов участника должно совпадать с количеством вопросов
        if (!isArray(attempt.answers) || attempt.answers.length !== data.correctAnswers.length) return false;
    }

    // Если все проверки пройдены — возвращаем true
    return true;
}

// Считаем результат для одного конкретного участника
export function calculateAttempt(attempt, correctAnswers) {
    let score = 0;
    // Проходим по всем ответам и сравниваем их с правильными по индексу
    for (let i = 0; i < correctAnswers.length; i++) {
        if (attempt.answers[i] === correctAnswers[i]) {
            score++;
        }
    }

    // Высчитываем процент и округляем по правилам математики
    const percentage = Math.round((score / correctAnswers.length) * 100);

    return {
        name: attempt.name.trim(),
        score: score,
        percentage: percentage,
        // Проходной балл берём из константы PASSING_PERCENTAGE (67%). Если процент больше или равен, то passed = true
        passed: percentage >= PASSING_PERCENTAGE
    };
}

// Собираем полный отчет по всей викторине
export function calculateReport(data) {
    // Сначала рассчитываем результаты для всех участников
    const attempts = data.attempts.map(attempt => calculateAttempt(attempt, data.correctAnswers));

    let sumPercentage = 0;
    let passedCount = 0;
    let best = null;

    // В одном цикле собираем суммы для среднего, считаем прошедших и ищем лучшего
    for (let i = 0; i < attempts.length; i++) {
        const att = attempts[i];
        sumPercentage += att.percentage;

        if (att.passed) passedCount++;

        // Если лучший еще не найден, или текущий набрал больше баллов — обновляем лучшего.
        // Если баллы равны, то остается тот, кто был первым (так как условие строго >)
        if (best === null || att.score > best.score) {
            best = att;
        }
    }

    // Считаем средний процент (сумма всех процентов делится на количество людей)
    const averagePercentage = Math.round(sumPercentage / attempts.length);

    // Возвращаем объект со всеми нужными полями по ТЗ
    return {
        quizTitle: data.quizTitle.trim(),
        questionCount: data.correctAnswers.length,
        participantCount: attempts.length,
        averagePercentage: averagePercentage,
        passedCount: passedCount,
        threshold: PASSING_PERCENTAGE,
        best: best,
        attempts: attempts
    };
}
