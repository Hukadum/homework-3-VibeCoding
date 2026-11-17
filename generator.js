/*
    Курс: Vibe Coding
    Домашнее задание №3: Генератор отчёта по викторине
    Выполнил: Молчанов Константин
    Группа: М26-555
*/
// Импортируем методы для работы с файловой системой и наши функции из stats.js
import { readFile, unlink, writeFile } from 'node:fs/promises'
import { calculateReport, validateQuizData } from './stats.js'

const outputPath = './report.html'

// Готовая защитная механика. Не изменяйте эту функцию.
function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;')
}

// Готовая защитная механика. Не изменяйте эту функцию.
function serializeForScript(value) {
    return JSON.stringify(value)
        .replaceAll('&', '\\u0026')
        .replaceAll('<', '\\u003c')
        .replaceAll('>', '\\u003e')
        .replaceAll('\u2028', '\\u2028')
        .replaceAll('\u2029', '\\u2029')
}

// Генерируем HTML-разметку для одного участника
function createAttemptMarkup(attempt) {
    const status = attempt.passed ? 'Порог пройден' : 'Порог не пройден'

    return `
        <li class="result-item ${attempt.passed ? 'status-passed' : 'status-failed'}">
            <span class="result-name">${escapeHtml(attempt.name)}</span>
            <span>${attempt.score} из ${attempt.questionCount} (${attempt.percentage}%) – ${status}</span>
        </li>`
}

// Каркас отчёта готов: он не оценивается и не требует новых браузерных API.
function createReportHtml(report) {
    const attemptsForBrowser = []
    let attemptsMarkup = ''

    // Проходим по всем попыткам, чтобы сформировать список и подготовить данные для браузера
    report.attempts.forEach((attempt) => {
        const attemptForBrowser = {
            name: attempt.name,
            score: attempt.score,
            percentage: attempt.percentage,
            passed: attempt.passed,
            questionCount: report.questionCount,
        }

        attemptsForBrowser.push(attemptForBrowser)
        attemptsMarkup += createAttemptMarkup(attemptForBrowser)
    })

    // Формируем данные, которые будут переданы в window.reportData для работы app.js
    const reportData = {
        questionCount: report.questionCount,
        attempts: attemptsForBrowser,
    }

    // Возвращаем готовую HTML-строку
    return `<!doctype html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(report.quizTitle)} – отчёт</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <main class="report">
        <h1>${escapeHtml(report.quizTitle)}</h1>

        <section class="summary" aria-labelledby="summary-title">
            <h2 id="summary-title">Сводка</h2>
            <div class="summary-grid">
                <p class="summary-card">Участников<br><strong>${report.participantCount}</strong></p>
                <p class="summary-card">Средний результат<br><strong>${report.averagePercentage}%</strong></p>
                <p class="summary-card">Лучший результат<br><strong>${escapeHtml(report.best.name)} — ${report.best.score} из ${report.questionCount} (${report.best.percentage}%)</strong></p>
                <p class="summary-card">Порог пройден<br><strong>${report.passedCount} из ${report.participantCount}</strong></p>
            </div>
        </section>

        <section class="results" aria-labelledby="results-title">
            <h2 id="results-title">Результаты участников</h2>
            <form id="filter-form">
                <label for="filter">Показать</label>
                <select id="filter" name="filter">
                    <option value="all">Все</option>
                    <option value="passed">Порог пройден</option>
                    <option value="failed">Порог не пройден</option>
                </select>
                <button type="submit">Применить</button>
            </form>
            <p id="result-count">Показано: ${report.participantCount} из ${report.participantCount}</p>
            <ul id="result-list" class="result-list">${attemptsMarkup}
            </ul>
        </section>
    </main>

    <script>window.reportData = ${serializeForScript(reportData)}</script>
    <script src="./app.js"></script>
</body>
</html>
`
}

// Выводим статистику в консоль после генерации
function printSummary(report) {
    console.log(`Участников: ${report.participantCount}`)
    console.log(`Средний результат: ${report.averagePercentage}%`)
    console.log(`Лучший результат: ${report.best.name} — ${report.best.score} из ${report.questionCount} (${report.best.percentage}%)`)
    console.log(`Порог пройден: ${report.passedCount} из ${report.participantCount}`)
    console.log('Отчёт: report.html')
}

// Готовая защитная механика. Вызовите её до чтения входного файла.
async function removePreviousReport() {
    try {
        await unlink(outputPath)
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error
        }
    }
}

// Готовая служебная функция для ожидаемых ошибок.
function fail(message) {
    console.log(message)
    process.exitCode = 1
}

// Основная асинхронная логика работы скрипта
async function main() {
    // 1. Получаем путь к файлу из аргументов командной строки
    const inputPath = process.argv[2]

    // 2. Удаляем старый отчет
    await removePreviousReport()

    // 3. Читаем файл, отдельно обрабатывая ошибку чтения
    let fileContent
    try {
        fileContent = await readFile(inputPath, 'utf8')
    } catch (error) {
        fail(`Ошибка чтения файла: ${error.code}`)
        return
    }

    // 4. Парсим JSON, отдельно обрабатывая ошибку синтаксиса
    let parsedData
    try {
        parsedData = JSON.parse(fileContent)
    } catch {
        fail('Ошибка данных')
        return
    }

    // 5. Проверяем структуру данных
    if (!validateQuizData(parsedData)) {
        fail('Ошибка структуры данных')
        return
    }

    // 6. Считаем отчет и генерируем HTML
    const report = calculateReport(parsedData)
    const html = createReportHtml(report)

    // 7. Записываем новый HTML-файл
    await writeFile(outputPath, html, 'utf8')

    // 8. Выводим сводку в консоль только после успешной записи
    printSummary(report)
}

// Запускаем программу
main()
