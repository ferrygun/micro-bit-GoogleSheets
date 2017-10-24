var SHEET_NAME = "Info";
var SCRIPT_PROP = PropertiesService.getScriptProperties(); // new property service

function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}

function doGet(e){
  return handleResponse(e);
}
 
function doPost(e){
  return handleResponse(e);
}

function fakeGet() {
  var eventObject = 
    {
      "parameter": {
        "action": "view",
        "page": 
        "3"
      },
      "contextPath": "",
      "contentLength": -1,
      "queryString": "name=Ferry&comment=Djaja",
      "parameters": {
        "action": ["view"],
        "page": ["3"]
      }
    }
  doGet(eventObject);
}
function handleResponse(e) {
  // shortly after my original solution Google announced the LockService[1]
  // this prevents concurrent access overwritting data
  // [1] http://googleappsdeveloper.blogspot.co.uk/2011/10/concurrency-and-google-apps-script.html
  // we want a public lock, one that locks for all invocations
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);  // wait 30 seconds before conceding defeat.
   
  try {
    // next set where we write the data - you could write to multiple/alternate destinations
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName(SHEET_NAME);
     
    // we'll assume header is in row 1 but you can override with header_row in GET/POST data
    var headRow = e.parameter.header_row || 1;
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var nextRow = sheet.getLastRow()+1; // get next row
    var row = []; 
    
    var id; 
    var name;
    // loop through the header columns
    for (i in headers){
      if (headers[i] == "id") 
        id = e.parameter[headers[i]];
       
      if (headers[i] == "name") 
        name = e.parameter[headers[i]];
        
    }
    
    Update(id, name);
    
    // more efficient to set values as [][] array than individually
    sheet.getRange(nextRow, 1, 1, row.length).setValues([row]);
    // return json success results
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "row": nextRow}))
          .setMimeType(ContentService.MimeType.JSON);
  } catch(e){
    // if error return this
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e}))
          .setMimeType(ContentService.MimeType.JSON);
  } finally { //release lock
    lock.releaseLock();
  }
}


function fakeUpdate() {
  Update('microbit', '18')
}

function Update(id, data){
  //Variable to keep track of the sheet
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var update = false;
  
  //Start at row 2, end at the last row of the spreadsheet
  for(var i=2;i<=sheet.getLastRow();i++){
    var value = sheet.getRange(i, 2).getValue();
    
    if(value == id){
      sheet.setActiveRange(sheet.getRange(i, 1)).setValue(new Date());
      sheet.setActiveRange(sheet.getRange(i, 3)).setValue(data);
      update = true;
    }
  }
  
  if(!update) {
    var lastrow = sheet.getLastRow() + 1;
    sheet.setActiveRange(sheet.getRange(lastrow, 1)).setValue(new Date());
    sheet.setActiveRange(sheet.getRange(lastrow, 2)).setValue(id);
    sheet.setActiveRange(sheet.getRange(lastrow, 3)).setValue(data);
  }
}

