﻿$engine JScript
$uname dvcs_fossil
$dname Backend к dvcs fossil
$addin global

// (c) Сосна Евгений shenja at sosna.zp.ua
// Скрипт - Backend к fossil для отображения версионного контроля. 

global.connectGlobals(SelfScript)

var pfFossilPath                    = "ExtFilesDVCS/fossilpath"
var pfFossilPathBase                = "ExtFilesDVCS/fossilpathbase"
profileRoot.createValue(pfFossilPath, ".\\fossil.exe", pflSnegopat) //по умолчанию будем указывать путь к fossil относительно корня. 
profileRoot.createValue(pfFossilPathBase, "", pflBase)

// Настройки для fossil 
var PathToFossil = "";
var мPathToFossilBase = "";
var мPathToFossil  = "";
мPathToFossilBase = profileRoot.getValue(pfFossilPathBase)
мPathToFossil = profileRoot.getValue(pfFossilPath)
// если не создаеться fso, необходимо в сделать в c:\windows\system32 
// regsvr32.exe scrrun.dll 
// после этого fso заработает. Во всем виновата корпорация добра http://social.technet.microsoft.com/Forums/ru/windowsserverru/thread/28d55900-145b-466b-93d4-74e08006c72f
var FSO = new ActiveXObject("Scripting.FileSystemObject");

if (мPathToFossilBase!=''){
    if (мPathToFossilBase.substr(0,1) == ".") {
        var мPathToFossilBase = FSO.GetAbsolutePathName(FSO.buildPath(mainFolder, мPathToFossilBase))
        }
    var f = v8New("File", мPathToFossilBase); 
    if (f.Exist()) {
        PathToFossil = мPathToFossilBase;
    }
}
if (PathToFossil=='' && мPathToFossil!='') { //прочтем настройки снегопата
    if (мPathToFossil.substr(0,1) == ".") {
        var мPathToFossil = FSO.GetAbsolutePathName(FSO.buildPath(mainFolder, мPathToFossil))
        }
    var f = v8New("File", мPathToFossil); 
    if (f.Exist()) {
        PathToFossil = мPathToFossil;
    }
}
if (PathToFossil == '') {
    мPathToFossil = "fossil.exe";
    PathToFossil = мPathToFossil;
}
if (PathToFossil.indexOf(" ")!=-1) {
    PathToFossil = '"'+PathToFossil+'"'
}


var ForReading = 1, ForWriting = 2, ForAppending = 8;
var WshShell = new ActiveXObject("WScript.Shell");
var TempDir = WshShell.ExpandEnvironmentStrings("%temp%") + "\\";
var mainFolder = profileRoot.getValue("Snegopat/MainFolder")

var СоответствиеФайловИСтатусов = [];

var мФормаНастройки=null

function macrosНастрокаFossil(){
    var pathToForm=SelfScript.fullPath.replace(/js$/, 'ssf')
    мФормаНастройки=loadScriptForm(pathToForm, SelfScript.self) // Обработку событий формы привяжем к самому скрипту
    мФормаНастройки.ОткрытьМодально()
}

function мЗаписатьНастройки()
{
    var FossilSnegopat = мФормаНастройки.cmdSnegopat;
    var FossilBase = мФормаНастройки.cmdBase;
    profileRoot.setValue(pfFossilPath, FossilSnegopat)
    profileRoot.setValue(pfFossilPathBase, FossilBase)
}

function НастройкиПриОткрытии()
{
    мФормаНастройки.cmdSnegopat=мPathToFossil
    мФормаНастройки.cmdBase=мPathToFossilBase
}

function cmdSnegopatНачалоВыбора(Элемент, СтандартнаяОбработка) {
    лФайл=мВыбратьФайл()
    if(лФайл=="") return
    Элемент.val.Значение=лФайл
}

function cmdBaseНачалоВыбора(Элемент, СтандартнаяОбработка) {
    лФайл=мВыбратьФайл()
    if(лФайл=="") return
    Элемент.val.Значение=лФайл
}

function КнопкаЗаписатьНажатие(Кнопка) {
    мЗаписатьНастройки();
    мФормаНастройки.Закрыть();
}

function мВыбратьФайл()
{
    ДиалогОткрытияФайла=v8New("ДиалогВыбораФайла", РежимДиалогаВыбораФайла.Открытие)
    //ДиалогОткрытияФайла.ПолноеИмяФайла = ""
    ДиалогОткрытияФайла.Заголовок = "Выберите файл с fossil "
    if(ДиалогОткрытияФайла.Выбрать()==false) return ""
    return ДиалогОткрытияФайла.ПолноеИмяФайла
}

function fossil_getRootCatalog(path){
    var result = "";
    for (var key in СоответствиеФайловИСтатусов){
        if (path.indexOf(key)!=-1) {
            result = key
            break
        }
    }
    if (result==undefined) {
        var f = v8New("File", path);
        if (f.Exist()) {
            var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
            var PathToBatFossil = TempDir + "fossilTrue.bat"
            var TextDoc = v8New("TextDocument");
            TextDoc.Записать(PathToFossilOutput, "UTF-8");
            //var pathToCatalog = f.Path;
            млКаталог = f.Path;
            TextDoc.AddLine('cd /d"' +млКаталог +'"')
            TextDoc.AddLine(PathToFossil +' status >> "'+PathToFossilOutput+'"');
            TextDoc.Write(PathToBatFossil, 'cp866');
            ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
            TextDoc.Read(PathToFossilOutput, "UTF-8");
            if (TextDoc.LineCount() == 0) {
                Message ("комманда отработала, но вывод не записался, надо отладить!")
                return "" //что то пошло не так. 
            }
        
            var i=0;
            for (var i=1; i<=TextDoc.LineCount(); i++)
            {
                var r = TextDoc.GetLine(i);
                if (r.indexOf("local-root:")!=-1){ // все нашли, теперь 
                    млКаталог  = r.split('   ')[1];
                    лКаталог = млКаталог.replace(/\//g, '\\');
                    лКаталог = лКаталог.substr(0, лКаталог.length-1);
                    break;
                }
            }
            TextDoc.Clear();
            TextDoc.Write(PathToFossilOutput, "UTF-8");
            result = лКаталог
        }
    }
    return result
} //fossil_getRootCatalog

function fossil_test(pathToCatalog) {
    
    var f = v8New("File", pathToCatalog);
	if (!f.Exist()) return false; 
    if (!f.IsDirectory()) return false;
    if (!FSO.FileExists(FSO.BuildPath(pathToCatalog, '_FOSSIL_'))) return false; //есть файл, тогда пробуем. Возможна проблема с тем, что _FOSSIL_ указывает у себя путь к несуществющему репозитарию.
    
    return true
} //fossil_test

function fossil_getStatusForCatalog(pathToCatalog, ValueTablesFiles) {

    СоответствиеФайловИСтатусов[pathToCatalog] = {};
    
    var СоответствиеСтатусов = СоответствиеФайловИСтатусов[pathToCatalog];
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine("Временный файл для fossil");
    TextDoc.Write(PathToFossilOutput, "UTF-8")
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "' +pathToCatalog+'"');
    TextDoc.AddLine(PathToFossil +' status >> "'+PathToFossilOutput+'"');
    TextDoc.AddLine('echo NOTVERSIONED >> "'+PathToFossilOutput+'"');
    TextDoc.AddLine(PathToFossil+' extras >> "'+PathToFossilOutput+'"');
    TextDoc.AddLine('echo ENDNOTVERSIONED >> "'+PathToFossilOutput+'"');
    TextDoc.Write(PathToBatFossil, "cp866");
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
            TextDoc.Read(PathToFossilOutput, "UTF-8");
            if (TextDoc.LineCount() == 0) {
                Message ("комманда отработала, но вывод не записался, надо отладить!")
                return false //что то пошло не так. 
            }
            
            var isNotVers = false;
            var i=0;
            for (var i=1; i<=TextDoc.LineCount(); i++)
            {
                var r = TextDoc.GetLine(i);
                //FIXME: добавить регулярку. 
                if (r.indexOf('EDITED')!=-1)
                {
                    filename = r.split('     ')[1]
                    СоответствиеСтатусов[FSO.BuildPath(pathToCatalog, filename.replace(/\//g, '\\'))]= "EDITED"
                    continue;
                }
                if (r.indexOf('MISSING')!=-1) 
                    {
                        filename = r.split('    ')[1]
                        СоответствиеСтатусов[FSO.BuildPath(pathToCatalog, filename.replace(/\//g, '\\'))]="DELETED"
                        continue;
                    }
                if (r.indexOf('ADDED')!=-1) 
                    {
                        filename = r.split('      ')[1]
                        СоответствиеСтатусов[FSO.BuildPath(pathToCatalog, filename.replace(/\//g, '\\'))]="ADDED"
                        continue;
                    }
                if (r.indexOf('tags')!=-1){
					filename = r.substr(14)
                    СоответствиеСтатусов[pathToCatalog]=filename;
                    continue;
				}
                if (r.indexOf('NOTVERSIONED')!=-1)  //Тут вручную указываем, просто читаем список файлов.
                    {
                        isNotVers = true;
                    }
                if (isNotVers==true){

                    if (r.indexOf('fossil')!=-1) continue
                
                    if (r.indexOf('ENDNOTVERSIONED')!=-1) { //надеюсь пока, никто не назовет так обработку , может UUID
                        isNotVers = false
                        continue;
                    };
                    СоответствиеСтатусов[FSO.BuildPath(pathToCatalog, r.replace(/\//g, '\\'))]= "NOTVERSIONED"
                    }
				
            }
    
        return true
} //fossil_getStatusForCatalog

function fossil_getFileAtRevision(pathToFile, rev){
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.Записать(PathToFossilOutput, "UTF-8");
    
    var f = v8New("File", pathToFile);
    if (!f.Exist()) 
    {
        Message(" файла физически не существует...") 
        return nell
    }
    var rootCatalog = fossil_getRootCatalog(pathToFile)
    if (rev.length !=0) {
    
        var filerev = FSO.BuildPath(TempDir, rev+f.Имя);
        
        
        TextDoc.AddLine('cd /d "' +rootCatalog +'"')
        TextDoc.AddLine(PathToFossil+' revert -r '+rev +' "'+pathToFile +'" ')
        TextDoc.AddLine('copy /Y "'+pathToFile +'" "'+filerev+'"')
        TextDoc.AddLine(PathToFossil+' undo "'+pathToFile +'" ')
        TextDoc.Write(PathToBatFossil, 'cp866');
        TextDoc.Clear();
        ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
        return filerev;
    }
    return null
} //fossil_getFileAtRevision

function fossil_getFilePathToDiff(param1, param2) { //текущая версия файла с предыдущей...
    
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.Записать(PathToFossilOutput, "UTF-8");
    // возвращать будем структру, path1 и path2 
    var pathToFile = param1;
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    param2.insert("path1", pathToFile);
    param2.insert("path2", "");
    /* 

Пока не забыл, как нам вытащить вариант старый файла...
АлгоритмТаков:
fossil finfo -b test.txt
[CODE]
7704d33278 2012-02-07 Sosna 'blal'
[/CODE]
для первой ревизии 
fossil finfo -p -r 7704d33278 test.txt  > blabla.txt
для второй ревизи
fossil revert -r 7704d33278 test.txt
copy test.txt > blabla.txt
да, да все через одно место....
 */
    var r = ""; // Текущая строка прочитанная
    var ver1 = '' // Номер версии первого файла
    var ver1sha1 = '' //sha1 первого файла в базе fossil
    
    // Запусим shell и найдем версии файлов. 
    TextDoc.Clear();
    TextDoc.AddLine('cd /d "' +rootCatalog +'"')
    TextDoc.AddLine(PathToFossil+' finfo -b --limit 1 "'+pathToFile+'" >> "' +PathToFossilOutput+'"');
    TextDoc.Write(PathToBatFossil, 'cp866');
    
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    TextDoc.Read(PathToFossilOutput, "UTF-8");
    if (TextDoc.LineCount() == 0) {
        Message (" 1 комманда отработала, но вывод не записался, надо отладить!")
        return false //что то пошло не так. 
    }
    if (TextDoc.LineCount() > 0){
        var r = TextDoc.GetLine(1)
        if (r.indexOf("no history for file") >=0) {
            Message("Файл не находился под версионным контролем, не счем сравнивать.");
            param2.insert("path1", pathToFile);
            param2.insert("path2", "");
            return param2;
        }
        ver1 = r.split(' ')[0]
    }
    TextDoc.Clear();
    TextDoc.Write(PathToFossilOutput, "UTF-8");

    if (ver1 == null || ver1 == "") {Message("ver 1 не нашли ничего"); return ;}
    var file2ToDiff = fossil_getFileAtRevision(pathToFile, ver1);
    if (file2ToDiff == null || file2ToDiff == "") {Message("Не смогли получить файл нужной ревизии" + ver1); return ;}
    param2.insert("path2", file2ToDiff);
    
    return true
} //getFilePathToDiff

function fossil_add(pathToFile, param2) {
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    var f = v8New("File", pathToFile);
    if (f.IsDirectory()) {
        pathToFile = '.'
    } else {
        pathToFile = '"'+pathToFile+'"'
    }
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "'+rootCatalog+'"')
    TextDoc.AddLine(PathToFossil +' add ' +pathToFile);
    TextDoc.Write(PathToBatFossil, 'cp866');
    
    TextDoc.Clear();
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    return ErrCode
} //fossil_add

function fossil_run(pathToFile){
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
	var abspath = FSO.GetAbsolutePathName(PathToFossil);
	var f = v8New('File', abspath);
	if (f.Exist()) {
		TextDoc.AddLine('PATH = %PATH%;'+f.Path+'"');
	}
    TextDoc.AddLine('cd /d "'+rootCatalog+'"')
    TextDoc.AddLine('start cmd.exe')
    TextDoc.Write(PathToBatFossil, 'cp866');
	ЗапуститьПриложение(PathToBatFossil, "", true);
	TextDoc = null;
} //fossil_run

function fossil_getFileStatus(pathToCatalog, pathToFile){
    var лКаталог = pathToCatalog
    if (СоответствиеФайловИСтатусов[лКаталог] == undefined) {
        Message("Get status for " + pathToCatalog + " "+СоответствиеФайловИСтатусов[лКаталог]);
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.Записать(PathToFossilOutput, "UTF-8");
    var лКаталог ="";
    //if (лКаталог == '') { //определим текущий ROOT каталог для fossil 
    var млКаталог = pathToCatalog;
    TextDoc.AddLine('cd /d"' +млКаталог +'"')
    TextDoc.AddLine(PathToFossil +' status >> "'+PathToFossilOutput+'"');
    TextDoc.Write(PathToBatFossil, 'cp866');
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    TextDoc.Read(PathToFossilOutput, "UTF-8");
    if (TextDoc.LineCount() == 0) {
        Message ("комманда отработала, но вывод не записался, надо отладить!")
        return null //что то пошло не так. 
    }
    var i=0;
    for (var i=1; i<=TextDoc.LineCount(); i++)
    {
        var r = TextDoc.GetLine(i);
        if (r.indexOf("local-root:")!=-1){ // все нашли, теперь 
                млКаталог  = r.split('   ')[1];
                лКаталог = млКаталог.replace(/\//g, '\\');
                лКаталог = лКаталог.substr(0, лКаталог.length-1);
                break;
        }
    }
    TextDoc.Clear();
    TextDoc.Write(PathToFossilOutput, "UTF-8");
    }
    
    СоответсвиеФайлов = СоответствиеФайловИСтатусов[лКаталог];
    if (СоответсвиеФайлов == undefined) return null 
    
    return (СоответсвиеФайлов[pathToFile] == undefined) ? null : СоответсвиеФайлов[pathToFile]
    
} //fossil_getFileStatus

function fossil_revert(pathToFile, ver) {
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    var f = v8New("File", pathToFile);
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "'+rootCatalog+'"')
    (ver.length>0) ? TextDoc.AddLine(PathToFossil +' revert -r '+ver+' "' +pathToFile+'"') : TextDoc.AddLine(PathToFossil +' revert  "' +pathToFile+'"')
    TextDoc.Write(PathToBatFossil, 'cp866');
    TextDoc.Clear();
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    return ErrCode
} //fossil_revert

function fossil_delete(pathToFile) {
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    var f = v8New("File", pathToFile);
    if (f.IsDirectory()) {
        return false
    }
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "'+rootCatalog+'"')
    TextDoc.AddLine(PathToFossil +' dele "' +pathToFile+'"');
    TextDoc.Write(PathToBatFossil, 'cp866');
    TextDoc.Clear();
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    return ErrCode
} //fossil_delete

function fossil_commit(pathToFile, message) {
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    var f = v8New("File", pathToFile);
    if (f.IsDirectory()) {
        pathToFile = ''
    } else {
        pathToFile = '"'+pathToFile+'"'
    }
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "'+rootCatalog+'"')
    TextDoc.AddLine(PathToFossil +' commit ' +pathToFile+' -m "'+message+'"');
    TextDoc.Write(PathToBatFossil, 'cp866');
    
    TextDoc.Clear();
    ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
    return ErrCode
} //fossil_commit

function fossil_showlog(pathToFile) { //временно, надо нарисовать красивю форму. 
    
    var rootCatalog = fossil_getRootCatalog(pathToFile);
    var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
    var PathToBatFossil = TempDir + "fossilTrue.bat"
    var TextDoc = v8New("TextDocument");
    TextDoc.AddLine('cd /d "'+rootCatalog+'"')
    TextDoc.AddLine(PathToFossil+' ui')
    TextDoc.Write(PathToBatFossil, 'cp866');
    ЗапуститьПриложение(PathToBatFossil);
} //fossil_showlog

function fossil_getLog(pathToFile) { //если каталог, тогда информация для каталога, если файл, тогда лог для файла. 
	//Возвращаем массив со стурктурой:
	// arrary[0]['version':122333, 'comment':"Че то написали", 'author':"sosna", 'date':"2012-04-01"]
	var result = []
	f = v8New("File", pathToFile);
	if (!f.Exist()) return result
	//Проверим, есть ли он под версионным контролем у нас.
	var rootCatalog = fossil_getRootCatalog(pathToFile);
	//пока будем нормально возвращать только для файла, надо спросить совета про парсинг общей истории...
	if (!f.IsDirectory()) {
		var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
		var PathToBatFossil = TempDir + "fossilTrue.bat"
		var TextDoc = v8New("TextDocument");
		TextDoc.AddLine('cd /d "'+rootCatalog+'"')
		var ПутьОтносительноКорневогоКаталога = pathToFile.replace(rootCatalog+'\\', '');
		TextDoc.AddLine(PathToFossil+' finfo -b '+ПутьОтносительноКорневогоКаталога +' > "'+PathToFossilOutput+'"')
		TextDoc.Write(PathToBatFossil, 'cp866');
		//TextDoc.Clear();
		ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
		TextDoc.Clear();
		//ЗапуститьПриложение(PathToBatFossil,"", true);
		TextDoc.Read(PathToFossilOutput, "UTF-8");
		if (TextDoc.LineCount() == 0) {
			//Message(" 0");
			return result 
		}
		var index=0;
		for (var i=1; i<=TextDoc.LineCount(); i++)
		{
			var r = TextDoc.GetLine(i);
			if (r.indexOf("file outside of")!=-1) return result
			re = new RegExp(/(\S*)\s(\S*)\s(\S*)\s(.*)/);
			var mathes = r.match(re);
			//Message(" 1"); 
			if (mathes && mathes.length) {
				//Message(" 2" + mathes[1]);
				result[index] = {"version":mathes[1], "comment":''+mathes[4], "date":mathes[2], "author":mathes[3]}
				index++;
			}
		}
	}
	
return result;	
} // fossil_getLog

function fossil_getInfo(pathToFile, ver) {
	var result = {"comment":"", "files":[]}
	var rootCatalog = fossil_getRootCatalog(pathToFile);
	var PathToFossilOutput = TempDir + "fossilstatus.txt" // Пишем 1С файл в utf-8, выводим туда статус fossil после этого читаем его. 
	var PathToBatFossil = TempDir + "fossilTrue.bat"
	var TextDoc = v8New("TextDocument");
	TextDoc.AddLine('cd /d "'+rootCatalog+'"')
	//var ПутьОтносительноКорневогоКаталога = pathToFile.replace(rootCatalog+'\\', '');
	TextDoc.AddLine(PathToFossil+' info  '+ver +' > "'+PathToFossilOutput+'"')
	TextDoc.Write(PathToBatFossil, 'cp866');
	ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
	TextDoc.Clear();
	TextDoc.Read(PathToFossilOutput, "UTF-8");
	result["comment"] = TextDoc.GetText();
	TextDoc.Clear();
	TextDoc.AddLine('cd /d "'+rootCatalog+'"')
	TextDoc.AddLine(PathToFossil+' timeline '+ver +' -n 1 -showfiles -t ci > "'+PathToFossilOutput+'"')
	TextDoc.Write(PathToBatFossil, 'cp866');
	ErrCode = WshShell.Run('"'+PathToBatFossil+'"', 0, 1)
	TextDoc.Clear();
	TextDoc.Read(PathToFossilOutput, "UTF-8");
	if (TextDoc.LineCount() == 0) {
		//Message(" 0");
		return result 
	}
	var index=0;
	for (var i=1; i<=TextDoc.LineCount(); i++)
	{
		var r = TextDoc.GetLine(i);
		/* if (r.length > 0) && (r[0]=='F') { //файл
			var ar = r.split(' ');
		} */
		//if (r.indexOf("file outside of")!=-1) return result
		//re = new RegExp(/(F)\s(\S*)\s(\S*)/);
		re = new RegExp(/\s*(EDITED|ADDED|DELETED)\s(.*)/);
		var mathes = r.match(re);
		//Message(" 1"); 
		if (mathes && mathes.length) {
			//Message(" 2" + mathes[1]);
			 //млКаталог.replace(/\//g, '\\')
			fullpathfile = mathes[2].replace(/\\s/g, ' ') //пробел так fossil отображает.
			//fullpathfile = fullpathfile.replace(/\//g, '\\');
			result['files'][index] = {"version":ver, "file":''+fullpathfile, "status":mathes[1], "fullpath":FSO.BuildPath(rootCatalog, fullpathfile.replace(/\//g, '\\'))}
			index++;
		}
	}
	return result
}

function Backend_fossil(command, param1, param2) {
    var result = false;
    switch (command) 
    {
    case "CATALOGSTATUS":
        // Добавляем в хвост подпись.
        result = fossil_getStatusForCatalog(param1, "");
        break;
    case "FILESTATUS":
        result = fossil_getFileStatus(param1, param2)
        break;
    case "GETFILESMISSUNG":
        result = {} //Заглушка. 
        break;
    case "DIFF":
        result = fossil_getFilePathToDiff(param1, param2)
        break;
    case "ADD":
        result = fossil_add(param1, param2)
        break;
    case "TEST":
        result = fossil_test(param1)
        break;
    case "RUN":
        result = fossil_run(param1, param2)
        break;
    case "SHOWLOG":
        result = fossil_showlog(param1);
        break
    case "SHOWDIFF":
        result = fossil_getFilePathToDiff(param1, param2);
        break
    case "DELETE":
        result = fossil_delete(param1)
        break
    case "REVERT":
        result = fossil_revert(param1, param2);
        break
    case "COMMIT":
        result = fossil_commit(param1, param2);
        break
    case "GETFILEATREVISION":
        result = fossil_getFileAtRevision(param1, param2)
        break
    case "GETLOG":
		result = fossil_getLog(param1);
        break
	case "GETINFO":
		result = fossil_getInfo(param1, param2);
		break
    }
    return result
} //Backend_fossil

function GetBackend() {
    return Backend_fossil
} //GetBackend

function getDefaultMacros() {
	return 'НастрокаFossil'
} //getDefaultMacros