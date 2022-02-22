var CsvToHtmlTable = CsvToHtmlTable || {};

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function tableDeleteRow(element) {
    var rowNumberElement = (((element.parentElement).previousSibling).previousSibling).previousSibling;
    var rowIdx = rowNumberElement.innerHTML;
    var table = document.getElementById("table-container-table");
    table.deleteRow(rowIdx);
    updateSequence();
}

function tableAddRow(element) {
    var rowNumberElement = (((element.parentElement).previousSibling).previousSibling).previousSibling;
    var rowIdx = rowNumberElement.innerHTML;
    var table = document.getElementById("table-container-table");
    var newRow = table.insertRow(parseInt(rowIdx) + 1);
    newRow.setAttribute("contenteditable", "true");
    for (let i = 0; i < 3; i ++) {
        newRow.insertCell(i);
    }
    var $controlPanel = newRow.insertCell(3);
    $controlPanel.innerHTML = "<button class='control-panel-button' id='delButton' onclick='tableDeleteRow(this)' contenteditable='false'><img src='assets/bin.png'/></button><button class='control-panel-button' id='addButton' onclick='tableAddRow(this)' contenteditable='false'><img src='assets/plus.png'/></button>";
    updateSequence();
}

function updateSequence() {
    var idTable = document.getElementById("table-container-table");
    for (var i = 1; i < idTable.rows.length; i++) {
        var td = idTable.rows[i].cells[0];
        td.innerHTML = i;
    }
}

function prepend(value, array) {
    var newArray = array.slice();
    newArray.unshift(value);
    return newArray;
}

CsvToHtmlTable = {
    init: function (options) {
        options = options || {};
        var csv_path = options.csv_path || "";
        var el = options.element || "table-container";
        var allow_download = options.allow_download || false;
        var write = options.write || false; // content editable
        var csv_options = options.csv_options || {};
        var datatables_options = options.datatables_options || {};
        var custom_formatting = options.custom_formatting || [];
        var customTemplates = {};
        $.each(custom_formatting, function (i, v) {
            var colIdx = v[0];
            var func = v[1];
            customTemplates[colIdx] = func;
        });

        var $table = $("<table class='table table-striped table-condensed' id='" + el + "-table'></table>");
        var $containerElement = $("#" + el);
        $containerElement.empty().append($table);

        $.when($.get(csv_path)).then(
            function (data) {
                var csvData = $.csv.toArrays(data, csv_options);
                var $tableHead = $("<thead></thead>");
                var csvHeaderRow = prepend('#', csvData[0]);
                if (write) {
                    csvHeaderRow.push('Control Panel');
                }
                var $tableHeadRow = $("<tr></tr>");
                for (var headerIdx = 0; headerIdx < csvHeaderRow.length; headerIdx++) {
                    $tableHeadRow.append($("<th></th>").text(csvHeaderRow[headerIdx]));
                }
                $tableHead.append($tableHeadRow);

                $table.append($tableHead);
                var $tableBody = $("<tbody></tbody>");
                // random order
                var order = Array.from({length: csvData.length - 1}, (_, i) => i + 1);
                var shuffleOrder = shuffle(order);

                for (var rowIdx = 1; rowIdx < csvData.length; rowIdx++) {
                    var $tableBodyRow = $("<tr></tr>");
                    for (var colIdx = -1; colIdx < csvHeaderRow.length - 1; colIdx++) {
                        var $tableBodyRowTd = (write) ? $("<td contenteditable='true'></td>") : $("<td></td>");
                        var cellTemplateFunc = customTemplates[colIdx];
                        if (cellTemplateFunc) {
                            $tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx]));
                        } else {
                            if (colIdx == -1) {
                                if (write) {
                                    $tableBodyRowTd.text(rowIdx); // editing enabled
                                } else {
                                    $tableBodyRowTd.text(shuffleOrder[rowIdx - 1]); // randomize the order 
                                }
                            } else if (colIdx == 1 && !write) {
                                var list = (csvData[rowIdx][colIdx]).split(", ");
                                for (var element of list) {
                                    var $button = $("<button class='chip'>" + element + "</button>");
                                    $tableBodyRowTd.append($button);
                                }
                            } else if (colIdx == 0 && write) {
                                var LaTeXText = csvData[rowIdx][colIdx];
                                var substring = LaTeXText.substring(2, LaTeXText.length - 2);
                                $tableBodyRowTd.text(substring);
                            } else if (colIdx == 2 && write) {
                                var $delButton = $("<button class='control-panel-button' id='delButton' onclick='tableDeleteRow(this)' contenteditable='false'><img src='assets/bin.png'/></button>");
                                var $addButton = $("<button class='control-panel-button' id='addButton' onclick='tableAddRow(this)' contenteditable='false'><img src='assets/plus.png'/></button>");
                                $tableBodyRowTd.append($delButton);
                                $tableBodyRowTd.append($addButton);
                            } else {
                                $tableBodyRowTd.text(csvData[rowIdx][colIdx]);
                            }
                        }
                        $tableBodyRow.append($tableBodyRowTd);
                        $tableBody.append($tableBodyRow);
                    }
                }
                $table.append($tableBody);

                if (write) {
                    $table.append("<colgroup><col span='1' style='width: 5%;'><col span='1' style='width: 50%;'><col span='1' style='width: 37.5%;'></colgroup><col span='1' style='width: 7.5%;'></colgroup>");
                }

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};