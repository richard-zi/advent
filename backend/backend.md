### Backend

Die bereitgestellten Multimediadaten sind einem Integer-Index (1-24) zugeordnet. Die Datei ``medium.json`` ist der Schlüssel zwischen Index und Dateiname (im ``(/media`` Ordner). Jeder Multimediadatei ist auch ein String zugeordnet (ich gehe davon aus, dass in jedem Türchen eine Art von Textnachricht enthalten sein wird). Diese ist in ``/messages`` enthalten als ``{index}.txt``.  

Die Daten werden auf zwei Weisen bereitgestellt: Zum einen der Link direkt auf das Medium (``/media/{index}``) und eine API (``/api``), eine JSON mit dem folgenden Format zurückgegeben: {    
    1: {  
        data : (Direkter Link zu dem Medium unter ``/media``),  
        type: ('text', 'image', 'video', 'audio' or 'unknown'),  
        message: (Optionale zusätzliche Nachricht geladen aus dem ``/messages`` Ordner)       
    }  
    2 : ...
}  

Beide Calls sind im Backend mit einem Zeit-Checker versehen (implementiert in ``timing.js``), der überprüft, ob das angefragte Medium überhaupt aufgerufen werden kann. Hierzu wird ein Startdatum definiert (1. Dez für prod) und der Index - 1 als Tage addiert als Referenzdatem. Dann wird geprüft, ob der heutige Tag (auf Serverseite definiert) gleich oder nach dem Referenzdatum liegt. Selbstverständlich werden die Daten, die noch nicht verfügbar sind, nicht geladen (Stattdessen wird Typ "not available yet" wenn die Daten noch nicht verfügbar sind.)