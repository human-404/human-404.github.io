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
                console.log(csvHeaderRow);
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
                    for (var colIdx = -1; colIdx < csvData[rowIdx].length; colIdx++) {
                        var $tableBodyRowTd = $("<td></td>");
                        var cellTemplateFunc = customTemplates[colIdx];
                        if (cellTemplateFunc) {
                            $tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx]));
                        } else {
                            if (colIdx == 1) {
                                var list = (csvData[rowIdx][colIdx]).split(", ");
                                for (var element of list) {
                                    var $button = $("<button class = 'chip'>" + element + "</button>");
                                    $tableBodyRowTd.append($button);
                                }
                            } else if (colIdx == -1) {
                                $tableBodyRowTd.text(shuffleOrder[rowIdx - 1]);
                            } else {
                                $tableBodyRowTd.text(csvData[rowIdx][colIdx]);
                            }
                        }
                        $tableBodyRow.append($tableBodyRowTd);
                        $tableBody.append($tableBodyRow);
                    }
                }
                $table.append($tableBody);

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};