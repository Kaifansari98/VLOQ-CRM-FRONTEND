/** Builds the standalone script users install in their lead spreadsheet. */
export function buildGoogleSheetsLeadScript(webhookUrl: string): string {
  return `const CRM_WEBHOOK_URL = ${JSON.stringify(webhookUrl)};\n` + String.raw`// Run setupCRMSync once with your lead tab selected, then authorize access.
// Existing rows are backfilled. Keep the CRM tracking columns with their rows when sorting.
const CRM_COLUMNS = ["CRM Sync Status", "CRM Synced At", "CRM Sync Hash", "CRM Sync Error"];

function setupCRMSync() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet || !CRM_WEBHOOK_URL) throw new Error("Open the lead spreadsheet and use the script copied from CRM.");
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error("Sync is running. Try setup again shortly.");
  try {
    const sheet = spreadsheet.getActiveSheet();
    ensureCRMColumns(sheet);
    PropertiesService.getScriptProperties().setProperties({
      CRM_SPREADSHEET_ID: spreadsheet.getId(),
      CRM_SHEET_ID: String(sheet.getSheetId()),
      CRM_NEXT_ROW: "2"
    });
    // Reinstall only this integration's triggers; leave unrelated triggers alone.
    ScriptApp.getProjectTriggers().forEach(function(trigger) {
      if (["syncPendingLeads", "sendLeadToCRM"].indexOf(trigger.getHandlerFunction()) !== -1) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    ScriptApp.newTrigger("syncPendingLeads").timeBased().everyMinutes(1).create();
    ScriptApp.newTrigger("sendLeadToCRM").forSpreadsheet(spreadsheet).onEdit().create();
    Logger.log("CRM sync installed for tab: " + sheet.getName());
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function ensureCRMColumns(sheet) {
  if (!sheet.getLastColumn()) throw new Error("Add lead column headers in row 1 before setup.");
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  CRM_COLUMNS.forEach(function(name) {
    if (headers.indexOf(name) === -1) {
      const column = headers.length + 1;
      if (column > sheet.getMaxColumns()) sheet.insertColumnsAfter(sheet.getMaxColumns(), 1);
      sheet.getRange(1, column).setValue(name);
      headers.push(name);
    }
  });
  return headers;
}

function syncPendingLeads() {
  runCRMSync(null);
}

// Optional immediate delivery for manual edits and multirow pastes.
function sendLeadToCRM(e) {
  if (e && e.range) runCRMSync(e);
}

function runCRMSync(event) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return; // Scheduled sync will pick up missed edits.
  try {
    const properties = PropertiesService.getScriptProperties();
    const spreadsheetId = properties.getProperty("CRM_SPREADSHEET_ID");
    const sheetId = properties.getProperty("CRM_SHEET_ID");
    if (!spreadsheetId || !sheetId) throw new Error("Run setupCRMSync once before syncing.");
    if (event && (event.source.getId() !== spreadsheetId || String(event.range.getSheet().getSheetId()) !== sheetId)) return;
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    const sheet = spreadsheet.getSheets().find(function(tab) { return String(tab.getSheetId()) === sheetId; });
    if (!sheet) throw new Error("Configured lead tab was removed. Run setupCRMSync on the correct tab.");
    const source = String(spreadsheet.getName()).trim();
    if (!source) throw new Error("Spreadsheet title could not be determined.");
    const headers = ensureCRMColumns(sheet);
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    const columns = CRM_COLUMNS.map(function(name) { return headers.indexOf(name) + 1; });
    // Read once per execution; only tracking cells are written back.
    const rows = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();
    let row = event ? Math.max(2, event.range.getRow()) : Number(properties.getProperty("CRM_NEXT_ROW") || 2);
    if (!event && (row < 2 || row > lastRow)) row = 2;
    const count = event ? Math.max(0, Math.min(lastRow, event.range.getLastRow()) - row + 1) : rows.length;
    const started = Date.now();
    let attempts = 0;
    for (let scanned = 0; scanned < count && attempts < 50 && Date.now() - started < 45000; scanned++) {
      const values = rows[row - 2];
      const payload = buildCRMLeadPayload(headers, values, source);
      if (payload) {
        const json = JSON.stringify(payload);
        // Include destination so switching environments/tokens cannot reuse old acknowledgements.
        const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, CRM_WEBHOOK_URL + json));
        if (values[columns[0] - 1] !== "Synced" || values[columns[2] - 1] !== hash) {
          attempts++;
          try {
            const response = UrlFetchApp.fetch(CRM_WEBHOOK_URL, {method: "post", contentType: "application/json", payload: json, muteHttpExceptions: true});
            const code = response.getResponseCode();
            const body = response.getContentText();
            Logger.log("Row " + row + " CRM Response Code: " + code);
            let result;
            try { result = JSON.parse(body); } catch (_) { throw new Error("HTTP " + code + ": CRM returned a non-JSON response"); }
            if (code < 200 || code >= 300 || result.success !== true || !result.lead || !result.lead.id) {
              throw new Error("HTTP " + code + ": " + String(result.error || result.message || "CRM did not confirm lead creation"));
            }
            sheet.getRange(row, columns[2]).setValue(hash);
            sheet.getRange(row, columns[1]).setValue(new Date().toISOString());
            sheet.getRange(row, columns[3]).setValue("");
            sheet.getRange(row, columns[0]).setValue("Synced");
          } catch (error) {
            sheet.getRange(row, columns[0]).setValue("Retry");
            sheet.getRange(row, columns[3]).setValue("CRM: " + String(error.message || error).slice(0, 400));
            Logger.log("Row " + row + " failed; will retry on a subsequent scan.");
          }
        }
      } else if (values[columns[0] - 1] !== "Waiting for name/phone") {
        sheet.getRange(row, columns[0]).setValue("Waiting for name/phone");
      }
      row = row >= lastRow ? 2 : row + 1;
      // Rotate through the sheet so failing rows cannot starve newer leads.
    }
    if (!event) properties.setProperty("CRM_NEXT_ROW", String(row));
  } finally {
    SpreadsheetApp.flush();
    lock.releaseLock();
  }
}

function buildCRMLeadPayload(headers, rowValues, spreadsheetName) {
    // 4. normalizeHeader() helper function
    function normalizeHeader(header) {
      if (!header) return "";
      return header.toString().toLowerCase().replace(/[\s_\/|\-?]+/g, "").trim();
    }

    // 5. Collect ALL sheet row columns dynamically
    var rowData = {};
    for (var i = 0; i < headers.length; i++) {
      var headerKey = headers[i] ? headers[i].toString().trim() : "";
      if (headerKey && CRM_COLUMNS.indexOf(headerKey) === -1) {
        var cellVal = rowValues[i];
        rowData[headerKey] = cellVal !== null && cellVal !== undefined ? String(cellVal).trim() : "";
      }
    }

    // 6. getValue() helper function (exact normalized matching)
    function getValue(possibleMatches) {
      for (var i = 0; i < headers.length; i++) {
        var normalizedColHeader = normalizeHeader(headers[i]);
        for (var j = 0; j < possibleMatches.length; j++) {
          var target = normalizeHeader(possibleMatches[j]);
          if (normalizedColHeader === target) {
            var cellValue = rowValues[i];
            return cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : "";
          }
        }
      }
      return "";
    }

    // 7. Extract lead fields with fallbacks
    const name = getValue(["Customer Name", "Full Name", "full_name", "Lead Name", "Name", "Client Name"]);
    const phone = getValue(["Phone Number", "phone_number", "Mobile Number", "Contact Number", "Phone", "Mobile", "Contact"]);
    const email = getValue(["Email ID", "Email Address", "Email", "Mail"]);
    const city = getValue(["City", "Project City", "Location", "Town"]);
    const remark = getValue(["Design Remarks", "Remarks", "Remark", "Notes", "Comments", "Requirement Details", "Description"]);

    const finalName = name || rowData["full_name"] || rowData["Full Name"] || rowData["name"] || rowData["Name"];
    const finalPhone = phone || rowData["phone_number"] || rowData["Phone Number"] || rowData["contact"] || rowData["Contact"];

    // Validation: Name + Phone required
    if (!finalName || !finalPhone) {
      Logger.log("Row is missing required Name or Phone. Waiting for complete data.");
      return;
    }

    // Remove any column named 'source' or 'Source' from rowData so sheet columns NEVER override the document title
    delete rowData["source"];
    delete rowData["Source"];
    delete rowData["SOURCE"];
    delete rowData["lead_source"];
    delete rowData["Lead Source"];

    // 9. Payload construction - sends dynamic spreadsheet title as source
    const payload = Object.assign({}, rowData, {
      name: finalName,
      contact: finalPhone,
      email: email || rowData["email"] || rowData["Email"] || "",
      city: city || rowData["city"] || rowData["where_is_your_project_located?"] || "",
      source: spreadsheetName,
      remark: remark || ""
    });
    payload.source = spreadsheetName;


    return payload;
}
`;
}
