


function getAvailableTests(el) {
  let selected_test = $("select_test").value;
  let url = apiProtocol + "://" + apiURL + ":" + apiPort + "/api/v1";
  url += "/programs/1/lab_tests/types/?search_string=" + selected_test;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      var obj = JSON.parse(this.responseText);
      buildTestTable(obj.reverse(), el);
    }
  };
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader('Authorization', sessionStorage.getItem("authorization"));
  xhttp.setRequestHeader('Content-type', "application/json");
  xhttp.send();
}

function buildTestTable(tests, el){
  el.innerHTML = null;
  var divTable = document.createElement("div");
  divTable.setAttribute("class","test-table");
  el.appendChild(divTable);
  var row = document.createElement("div");
  row.setAttribute("class","test-table-row");
  divTable.appendChild(row);
  var rowCount = 0;

  for(var i = 0; i < tests.length; i++){
    if(rowCount == 3) {
      row = document.createElement("div");
      row.setAttribute("class","test-table-row");
      divTable.appendChild(row);
      rowCount = 0;
    }

    var cell = document.createElement("div");
    cell.setAttribute("class","test-table-cell");
    cell.setAttribute("style","background-color: white;");
    cell.innerHTML = tests[i];
    cell.setAttribute("onmousedown","selectTest(this);");
    cell.setAttribute("id", tests[i]);
    row.appendChild(cell);
    rowCount++;
  }
}

function selectTest(e){
  var cells = document.getElementsByClassName("test-table-cell");
  for(var i = 0; i < cells.length; i++){
    if(cells[i].id == e.id)
      continue;

    cells[i].setAttribute("style","background-color: white;");
  }

  if(e.getAttribute("style").match(/lightblue/)){
    e.setAttribute("style","background-color: white;");
  }else{
    e.setAttribute("style","background-color: lightblue;");
  }
}