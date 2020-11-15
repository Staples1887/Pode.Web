$.expr[":"].icontains = $.expr.createPseudo(function(arg) {
    return function(elem) {
        return $(elem).text().toLowerCase().indexOf(arg.toLowerCase()) >= 0;
    };
});

(function () {
    feather.replace();
})();

$(document).ready(() => {
    loadTables();
    bindFormSubmits();
    bindTableFilters();
    bindTableExports();
    bindTableRefresh();
});

function loadTables(tableId) {
    if (tableId && !tableId.startsWith('#')) {
        tableId = `#${tableId}`;
    }

    if (!tableId) {
        tableId = '';
    }

    $(`table${tableId}[data-pode-dynamic='True']`).each((i, e) => {
        $.ajax({
            url: `/components/table/${$(e).attr('id')}`,
            method: 'post',
            success: function(res) {
                loadComponents(res, $(e));
            }
        });
    });
}

function loadComponents(components, sender) {
    if (!components) {
        return;
    }

    if (!$.isArray(components)) {
        components = [components];
    }

    components.forEach((comp) => {
        switch (comp.OutputType.toLowerCase()) {
            case 'table':
                outputTable(comp, sender);
                break;

            case 'textbox':
                outputTextbox(comp, sender);
                break;

            case 'toast':
                newToast(comp);
                break;

            default:
                break;
        }
    });
}

function bindFormSubmits() {
    $("form.pode-component-form").submit(function(e) {
        e.preventDefault();
        e.stopPropagation();

        var form = $(e.target);
        var spinner = form.find('button span.spinner-border');

        spinner.show();

        $.ajax({
            url: form.attr('method'),
            method: form.attr('action'),
            data: form.serialize(),
            contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
            success: function(res) {
                spinner.hide();
                loadComponents(res, form);
            }
        });
    });
}

function bindTableFilters() {
    $("input.pode-table-filter").keyup(function(e) {
        e.preventDefault();

        var input = $(e.target);
        var tableId = input.attr('for');
        var value = input.val();

        console.log(tableId);
        console.log(value);
        $(`table#${tableId} tbody tr:not(:icontains('${value}'))`).css("display", "none");
        $(`table#${tableId} tbody tr:icontains('${value}')`).css("display", "");
    });
}

function bindTableExports() {
    $("button.pode-table-export").click(function(e) {
        e.preventDefault();

        var input = $(e.target);
        var tableId = input.attr('for');

        exportTableAsCSV(tableId);
    });
}

function bindTableRefresh() {
    $("button.pode-table-refresh").click(function(e) {
        e.preventDefault();

        var input = $(e.target);
        var tableId = input.attr('for');

        loadTables(tableId);
    });
}

function outputTable(component, sender) {
    if (component.ID) {
        updateTable(component);
    }
    else {
        writeTable(component, sender);
    }
}

function updateTable(component) {
    if (!component.Data) {
        return;
    }

    if (!$.isArray(component.Data)) {
        component.Data = [component.Data];
    }

    if (component.Data.length <= 0) {
        return;
    }

    var keys = Object.keys(component.Data[0]);

    var tableId = `table#${component.ID}`;
    var tableHead = $(`${tableId} thead`);
    var tableBody = $(`${tableId} tbody`);

    tableHead.empty();
    var _value = '<tr>';
    keys.forEach((key) => {
        _value += `<th>${key}</th>`;
    });
    _value += '</tr>';
    tableHead.append(_value);

    tableBody.empty();
    component.Data.forEach((item) => {
        _value = '<tr>';
        keys.forEach((key) => {
            _value += `<td>${item[key]}</td>`;
        });
        _value += '</tr>'
        tableBody.append(_value);
    });
}

function writeTable(component, sender) {
    var senderId = getId(sender);
    var tableId = `table_${senderId}`;

    // card
    var card = sender.closest('.card-body');

    // create table
    var table = $(`table#${tableId}`);
    if (table.length == 0) {
        card.append(`
            <table id="${tableId}" class="table table-striped table-sm">
                <thead></thead>
                <tbody></tbody>
            </table>
        `);
    }

    // update
    component.ID = tableId;
    updateTable(component);
}

function getId(element) {
    return $(element).attr('id');
}

function newToast(component) {
    var toastArea = $('div#toast-area');
    if (toastArea.length == 0) {
        return;
    }

    var toastCount = $('.toast').length;
    var toastId = `toast${toastCount + 1}`;

    toastArea.append(`
        <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-delay="${component.Duration}">
            <div class="toast-header">
                <span data-feather='${component.Icon}'></span>
                <strong class="mr-auto mLeft05">${component.Title}</strong>
                <button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="toast-body">
                ${component.Message}
            </div>
        </div>
    `);

    feather.replace();

    $(`div#${toastId}`).on('hidden.bs.toast', function(e) {
        $(e.target).remove();
    })

    $(`div#${toastId}`).toast('show');
}

function outputTextbox(component, sender) {
    if (component.ID) {
        updateTextbox(component);
    }
    else {
        writeTextbox(component, sender);
    }
}

function updateTextbox(component) {
    if (!component.Data) {
        return;
    }

    if (component.AsJson) {
        component.Data = JSON.stringify(component.Data, null, 4);
    }

    var txtId = `input#${component.ID}`;
    if (component.Multiline) {
        txtId = `textarea#${component.ID}`;
    }

    var txt = $(txtId);
    txt.val(component.Data);
}

function writeTextbox(component, sender) {
    var senderId = getId(sender);
    var txtId = `txt_${senderId}`;

    // create textbox
    var element = null;
    var txt = null;

    if (component.Multiline) {
        txt = $(`textarea#${txtId}`);
        if (txt.length == 0) {
            element = `<pre><textarea class='form-control' id='${txtId}' rows='${component.Height}'></textarea></pre>`;
        }
    }
    else {
        txt = $(`input#${txtId}`);
        if (txt.length == 0) {
            element = `<input type='text' class='form-control' id='${txtId}'>`;
        }
    }

    if (element) {
        if (component.Preformat) {
            element = `<pre>${element}</pre>`;
        }

        var card = sender.closest('.card-body');
        card.append(element);
    }

    // update
    component.ID = txtId;
    updateTextbox(component);
}

function exportTableAsCSV(tableId) {
    var csv = [];
    var rows = $(`table#${tableId} tr:visible`);

    if (!rows || rows.length == 0) {
        return;
    }

    for (var i = 0; i < rows.length; i++) {
        var row = [];
        var cols = $(rows[i]).find('td, th');

        for (var j = 0; j < cols.length; j++) {
            row.push(cols[j].innerText);
        }

        csv.push(row.join(","));
    }

    // download
    var tableName = $(`table#${tableId}`).attr('name').replace(' ', '_');
    downloadCSV(csv.join("\n"), `${tableName}.csv`);
}

function downloadCSV(csv, filename) {
    // the csv file
    var csvFile = new Blob([csv], {type: "text/csv"});

    // build a hidden download link
    var downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';

    // add the link, and click it
    document.body.appendChild(downloadLink);
    downloadLink.click();

    // remove the link
    $(downloadLink).remove();
}