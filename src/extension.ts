import * as vscode from 'vscode';

let timer: NodeJS.Timeout | undefined;
let timeRemaining: number = 0;
let statusBarItem: vscode.StatusBarItem;
let isRunning: boolean = false;

export function activate(context: vscode.ExtensionContext) {
    console.log('Eye Break Reminder активирован!');

    statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = '$(eye) Eye Break: Выкл';
    statusBarItem.tooltip = 'Нажмите для запуска таймера';
    statusBarItem.command = 'eyeBreakReminder.start';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    const startCommand = vscode.commands.registerCommand(
        'eyeBreakReminder.start',
        startTimer
    );
    const stopCommand = vscode.commands.registerCommand(
        'eyeBreakReminder.stop',
        stopTimer
    );
    const resetCommand = vscode.commands.registerCommand(
        'eyeBreakReminder.reset',
        resetTimer
    );

    context.subscriptions.push(startCommand, stopCommand, resetCommand);

    const config = vscode.workspace.getConfiguration('eyeBreakReminder');
    const autoStart = config.get<boolean>('autoStart', true);
    
    if (autoStart) {
        startTimer();
    }
}

function getIntervalMinutes(): number {
    const config = vscode.workspace.getConfiguration('eyeBreakReminder');
    return config.get<number>('interval', 40);
}

function startTimer() {
    if (isRunning) {
        vscode.window.showWarningMessage(
            'Таймер уже запущен! Остановите его перед запуском нового.'
        );
        return;
    }

    const intervalMinutes = getIntervalMinutes();
    timeRemaining = intervalMinutes * 60;
    isRunning = true;

    updateStatusBar();

    timer = setInterval(() => {
        timeRemaining--;

        if (timeRemaining <= 0) {
            showBreakNotification();
            timeRemaining = getIntervalMinutes() * 60;
        }

        updateStatusBar();
    }, 1000);

    vscode.window.showInformationMessage(
        `Eye Break Reminder: Таймер запущен! Напоминание через ${intervalMinutes} мин.`
    );
}

function stopTimer() {
    if (!isRunning) {
        vscode.window.showWarningMessage('Таймер не запущен!');
        return;
    }

    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }

    isRunning = false;
    statusBarItem.text = '$(eye) Eye Break: Выкл';
    statusBarItem.tooltip = 'Нажмите для запуска таймера';

    vscode.window.showInformationMessage(
        'Eye Break Reminder: Таймер остановлен.'
    );
}

function resetTimer() {
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }

    isRunning = false;
    timeRemaining = 0;
    statusBarItem.text = '$(eye) Eye Break: Сброшен';
    statusBarItem.tooltip = 'Нажмите для запуска таймера';

    vscode.window.showInformationMessage(
        'Eye Break Reminder: Таймер сброшен.'
    );
}

function updateStatusBar() {
    if (!isRunning) return;

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    statusBarItem.text = `$(eye) Eye Break: ${timeString}`;
    statusBarItem.tooltip = `До перерыва: ${timeString}\nНажмите для остановки`;
    statusBarItem.command = 'eyeBreakReminder.stop';
}

function showBreakNotification() {
    const actions = ['Сделать перерыв', 'Напомнить через 5 мин', 'Отключить на час'];

    vscode.window
        .showInformationMessage(
            'Время сделать перерыв для глаз! Посмотрите вдаль на 20 секунд.',
            ...actions
        )
        .then((selection) => {
            if (selection === 'Сделать перерыв') {
                const intervalMinutes = getIntervalMinutes();
                timeRemaining = intervalMinutes * 60;
                vscode.window.showInformationMessage('Отлично! Таймер перезапущен.');
            } else if (selection === 'Напомнить через 5 мин') {
                timeRemaining = 5 * 60;
                vscode.window.showInformationMessage('Напоминание отложено на 5 минут.');
            } else if (selection === 'Отключить на час') {
                timeRemaining = 60 * 60;
                vscode.window.showInformationMessage('Напоминание отложено на 1 час.');
            }
        });
}

export function deactivate() {
    if (timer) {
        clearInterval(timer);
    }
    statusBarItem.dispose();
}
