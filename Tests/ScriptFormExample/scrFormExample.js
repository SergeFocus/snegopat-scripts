﻿$engine JScript
$uname ScriptFormExample
$dname Демонстрация ошибки динамического подключения обработчика события формы
$addin global
$addin stdlib

function macrosПоказать() {

    var wnd = new MyScriptForm();
    wnd.Show();
}

function getDefaultMacros() {
    return 'Показать';
}

function MyScriptForm () {
    this.form = loadScriptForm(SelfScript.fullPath.replace(/js$/, 'ssf'), this);
    this.attachEvent('OnOpen');
    this.attachEvent('OnClose');
    this.attachEvent('BeforeClose');
}

MyScriptForm.prototype.Show = function () {
    this.form.Open();
}

MyScriptForm.prototype.attachEvent = function (eventName) {
    this.form.SetAction(eventName, v8New('Action', eventName));
}

MyScriptForm.prototype.OnOpen = function () {
    Message('ПриОткрытии');
    this.form.Controls.Кнопка1.SetAction('Нажатие', v8New('Action', 'Кнопка1Нажатие'));
}

MyScriptForm.prototype.BeforeClose = function (Отказ, СтандартнаяОбработка) {
    Message('ПередЗакрытием');
}

MyScriptForm.prototype.OnClose = function () {
    Message('ПриЗакрытии');
}

MyScriptForm.prototype.Кнопка1Нажатие = function (bt) {
    /* Демонстрация ошибки:
    При попытки динамически назначить обработчик нажатия кнопки командной панели
    возникает исключение "Объект не поддерживает это свойство или метод",
    но обработчик успешно назначается и корректно отрабатывает в последствии.
    Порядок воспроизведения:
    1. Открываем форму скрипта, вызвав макрос "Показать".
    2. Обращаем внимание, что поскольку обработчик кнопки командной панели "Кнопка 2" 
    не назначен на момент открытия формы, то сама кнопка не доступна.
    3. Нажимаем на кнопку "Кнопка 1" на форме. В обработчике нажатия этой кнопки выполняется 
    установка действия нажатия на кнопку "Кнопка 2" командной панели. Обработчик - метод КомманднаяПанель1Кнопка2
    объекта MyScriptForm. При нажатии на кнопку выбрасывается исключение "Объект не поддерживает это свойство или метод".
    4. Закрываем окно с исключением (отладку не начинаем). Видим, что кнопка "Кнопка 2" стала доступной.
    При нажатии на кнопку "Кнопка 2" выводится сообщение 'При нажатии кнопки командной панели', т.е. обработчик отрабатывает.
    */
    this.form.ЭлементыФормы.КоманднаяПанель1.Кнопки.Кнопка2.Действие = v8New('Action', 'КомманднаяПанель1Кнопка2');
}

MyScriptForm.prototype.КомманднаяПанель1Кнопка2 = function (bt) {
    Message('При нажатии кнопки командной панели');
}



/* Перечень событий формы скрипта.
ПередОткрытием(Отказ, СтандартнаяОбработка)
BeforeOpen(Отказ, СтандартнаяОбработка)

ПриОткрытии
OnOpen()

ПриПовторномОткрытии()
OnReopen(СтандартнаяОбработка)

ОбновлениеОтображения()
RefreshDisplay()

ПередЗакрытием(Отказ, СтандартнаяОбработка)
BeforeClose(Отказ, СтандартнаяОбработка)

ПриЗакрытии()
OnClose()

ОбработкаВыбора(ЗначениеВыбора, Источник)
ChoiceProcessing(ЗначениеВыбора, Источник)

ОбработкаАктивизацииОбъекта(АктивныйОбъект, Источник)
ObjectActivationProcessing(АктивныйОбъект, Источник)

ОбработкаЗаписиНовогоОбъекта(Объект, Источник) 
NewObjectWriteProcessing(Объект, Источник)

ОбработкаОповещения(ИмяСобытия, Параметр, Источник)
NotificationProcessing(ИмяСобытия, Параметр, Источник)

ОбработкаВнешнегоСобытия(Источник, Событие, Данные)
ExternalEvent(Источник, Событие, Данные)

ОбработкаПроверкиЗаполнения(Отказ, ПроверяемыеРеквизиты)
FillCheckProcessing(Отказ, ПроверяемыеРеквизиты)

ПриСменеСтраницы(ТекущаяСтраница)
OnCurrentPageChange(ТекущаяСтраница)
*/