var CsvToHtmlTable = CsvToHtmlTable || {};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// wait for bool in order to execute the function
function waitFor(bool, functional, fail, counter, maximum) {
    // the maximum waiting time = maximum * 50 milliseconds
    if (counter == maximum) {
        // fail to satisfy requirement
        fail();
    } else {
        // wait for 50 milliseconds
        sleep(50).then(() => {
            if (bool()) {
                // success
                functional();
                return;
            } else {
                waitFor(bool, functional, fail, counter + 1, maximum);
            }
        });
    }
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function removeChildren(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function wikipedia(element) {
    window.open("https://en.wikipedia.org/w/index.php?search=" + element.innerHTML + "&title=Special%3ASearch&go=Go&ns0=1");
}

function tableDeleteRow(element) {
    if (document.getElementsByClassName("form-control form-control-sm")[0].value) {
        alert("editing disabled");
        return;
    }
    var rowNumberElement = (((element.parentElement).previousSibling).previousSibling).previousSibling;
    var rowIdx = rowNumberElement.innerHTML;
    var table = document.getElementById("table-container-table");
    table.deleteRow(rowIdx);
    updateSequence();
}

function tableAddRow(element) {
    if (document.getElementsByClassName("form-control form-control-sm")[0].value) {
        alert("editing disabled");
        return;
    }
    var rowNumberElement = (((element.parentElement).previousSibling).previousSibling).previousSibling;
    var rowIdx = rowNumberElement.innerHTML;
    var table = document.getElementById("table-container-table");
    
    var newRow = table.insertRow(parseInt(rowIdx) + 1);
    var $number = newRow.insertCell(0);
    var $TeXdiv = newRow.insertCell(1);
    var $tagdiv = newRow.insertCell(2);
    var $controlPanel = newRow.insertCell(3);

    newRow.setAttribute("class", "plainText");
    $number.setAttribute("align", "center");
    $tagdiv.setAttribute("align", "center");
    $tagdiv.setAttribute("contenteditable", "true");
    $controlPanel.setAttribute("align", "center");

    $TeXdiv.innerHTML = "<div class='tex2jax_ignore' contenteditable='true' align='center'>$$ $$</div>";
    $controlPanel.innerHTML = "<button class='control-panel-button' id='delButton' onclick='tableDeleteRow(this)' contenteditable='false'><img src='assets/bin.png'/></button><button class='control-panel-button' id='addButton' onclick='tableAddRow(this)' contenteditable='false'><img src='assets/plus.png'/></button><button class='control-panel-button' id='renderButton' onclick='renderControl(this)' contenteditable='false'><img src='assets/gallery.png'/></button>";
    
    updateSequence();
}

function renderControl(element) {    
    var TeXCol = ((element.parentElement).previousSibling).previousSibling;
    var tagCol = ((element.parentElement).previousSibling);

    if (TeXCol.hasChildNodes()) {
        var TeXColElement = TeXCol.children[0];
        if (TeXColElement.className == "isRendered") {
            // LaTeX text
            var textLaTeX = "$$" + TeXColElement.children[2].text + "$$";
            removeChildren(TeXColElement);
            TeXColElement.innerHTML = textLaTeX;
            TeXColElement.setAttribute("class", "tex2jax_ignore");

            // chip children
            var list = [];
            for (var child of tagCol.children) {
                var chipText = " " + child.innerHTML;
                list.push(chipText);
            }
            tagCol.innerHTML = list.toString();

            TeXColElement.setAttribute("contenteditable", "true");
            tagCol.setAttribute("contenteditable", "true");

        } else {

            TeXColElement.setAttribute("class", "isRendered");
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, TeXColElement]);

            function isRendered() {
                return TeXColElement.children[2];
            }

            // render incomplete within the time limit
            function failure() {
                TeXColElement.setAttribute("class", "tex2jax_ignore");
                alert("fail to render TeX");
                return;
            }
            
            function complete() {
                // chip
                var list = (tagCol.innerHTML).split(", ");
                var textInit = "";
                for (var item of list) {
                    textInit = textInit.concat("<button class='chip' onclick='wikipedia(this)'>" + item + "</button>");
                }
                tagCol.innerHTML = textInit;

                TeXColElement.setAttribute("contenteditable", "false");
                tagCol.setAttribute("contenteditable", "false");
            }

            waitFor(isRendered, complete, failure, 0, 10);
        }
    } else {
        alert("render control error");
    }
}

function updateSequence() {
    var idTable = document.getElementById("table-container-table");
    for (var i = 1; i < idTable.rows.length; i++) {
        var td = idTable.rows[i].cells[0];
        td.innerHTML = i;
    }
    updatePlainText();
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
                        var $tableBodyRowTd;
                        if (colIdx == -1 || colIdx == 2) {
                            $tableBodyRowTd = (write) ? $("<td contenteditable='false' align='center'></td>") : $("<td align='center'></td>");
                        } else {
                            $tableBodyRowTd = (write) ? $("<td contenteditable='false' class='plainText' align='center'></td>") : $("<td align='center'></td>");
                        }
                        var cellTemplateFunc = customTemplates[colIdx];
                        if (cellTemplateFunc) {
                            $tableBodyRowTd.html(cellTemplateFunc(csvData[rowIdx][colIdx]));
                        } else {
                            if (colIdx == -1) {
                                $tableBodyRowTd.text(shuffleOrder[rowIdx - 1]); // randomize the order
                            } else if (colIdx == 1) {
                                var list = ((csvData[rowIdx][colIdx]).split(", "));
                                list = list.sort(function(a,b) {
                                    a = a.toLowerCase();
                                    b = b.toLowerCase();
                                    if( a == b) return 0;
                                    return a < b ? -1 : 1;
                                });
                                for (var element of list) {
                                    var $button = $("<button class='chip' onclick='wikipedia(this)'>" + element + "</button>");
                                    $tableBodyRowTd.append($button);
                                }
                            } else if (colIdx == 0 && write) {
                                var $TeXdiv = $("<div class='isRendered'>" + csvData[rowIdx][colIdx] + "</div>");
                                $tableBodyRowTd.append($TeXdiv);
                            } else if (colIdx == 2 && write) {
                                var $delButton = $("<button class='control-panel-button' id='delButton' onclick='tableDeleteRow(this)' contenteditable='false'><img src='assets/bin.png'/></button>");
                                var $addButton = $("<button class='control-panel-button' id='addButton' onclick='tableAddRow(this)' contenteditable='false'><img src='assets/plus.png'/></button>");
                                var $renderButton = $("<button class='control-panel-button' id='renderButton' onclick='renderControl(this)' contenteditable='false'><img src='assets/gallery.png'/></button>");
                                $tableBodyRowTd.append($delButton);
                                $tableBodyRowTd.append($addButton);
                                $tableBodyRowTd.append($renderButton);
                            } else {
                                $tableBodyRowTd.text(csvData[rowIdx][colIdx]);
                            }
                        }
                        $tableBodyRow.append($tableBodyRowTd);
                        $tableBody.append($tableBodyRow);
                    }
                }
                $table.append($tableBody);
                updatePlainText();

                if (write) {
                    $table.append("<colgroup><col span='1' style='width: 5%;'><col span='1' style='width: 50%;'><col span='1' style='width: 35%;'><col span='1' style='width: 10%;'></colgroup>");
                } else {
                    $table.append("<colgroup><col span='1' style='width: 5%;'><col span='1' style='width: 50%;'><col span='1' style='width: 45%;'></colgroup>");
                }

                $table.DataTable(datatables_options);

                if (allow_download) {
                    $containerElement.append("<p><a class='btn btn-info' href='" + csv_path + "'><i class='glyphicon glyphicon-download'></i> Download as CSV</a></p>");
                }
            });
    }
};