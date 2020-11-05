

function fetchTests() {
  let url = apiProtocol + "://" + apiURL + ":" + apiPort + "/api/v1";
  url += "/programs/1/lab_tests/types/?specimen_type=" + selectedTest;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      var obj = JSON.parse(this.responseText);
      var el = document.getElementById("inputFrame"  + tstCurrentPage);
      el.style = "width: 95.5%; height: 90%; overflow: auto;";
      el.innerHTML = null;
      let viral_load; let tests = [];

      for(let i = 0; i < obj.length; i++){
        if(obj[i].name.match(/viral load/i))
          viral_load = obj[i];

         tests.push(obj[i]);
      }

      if(viral_load != undefined)
        tests.splice(0,0,viral_load);

      buildTestTable(tests, el);
    }
  };
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader('Authorization', sessionStorage.getItem("authorization"));
  xhttp.setRequestHeader('Content-type', "application/json");
  xhttp.send();
}

function getAvailableSpecimen(test_string) {
  let url = apiProtocol + "://" + apiURL + ":" + apiPort + "/api/v1";
  url += "/programs/1/lab_tests/panels/?search_string=" + test_string;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      var obj = JSON.parse(this.responseText);
      renderTests(obj);
    }
  };
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader('Authorization', sessionStorage.getItem("authorization"));
  xhttp.setRequestHeader('Content-type', "application/json");
  xhttp.send();
}

function buildTestTable(tests, el){
  var divTable = document.createElement("div");
  divTable.setAttribute("class","test-table");
  el.appendChild(divTable);
  var row = document.createElement("div");
  row.setAttribute("class","test-table-row");
  divTable.appendChild(row);
  var rowCount = 0;

  for(var i = 0; i < tests.length; i++){
    if(rowCount == 4) {
      row = document.createElement("div");
      row.setAttribute("class","test-table-row");
      divTable.appendChild(row);
      rowCount = 0;
    }

    var cell = document.createElement("div");
    cell.setAttribute("class","test-table-cell");
    cell.setAttribute("style","background-color: white;");
    cell.innerHTML = assignCheckBox(tests[i].name, tests[i].concept_id);
    cell.setAttribute("onmousedown","selectTest(this);");
    cell.setAttribute("id", tests[i].concept_id);
    cell.setAttribute("concept_name", tests[i].name);
    row.appendChild(cell);
    rowCount++;

    //if(selectedTest == tests[i].name || selected_cat == tests[i].name)
      //cell.setAttribute("style","background-color: lightblue;");

  }
}

function assignCheckBox(concept_name, concept_id) {
  return `
  <table class = "tests-boxes">
    <tr>
      <td class="check-boxes"><img src="../assets/images/stop.png" 
        class="checkbox-icons" id= "checkbox-${concept_id}" /></td>
      <td class="concept-names">${concept_name}</td>
    </tr>
  </table>`;
}

var selected_tests = {};

function selectTest(e){
  if(e.getAttribute("style").match(/lightblue/i)){
    e.setAttribute("style","background-color: white;");
    let img = $(`checkbox-${e.id}`);
    img.setAttribute("src","../assets/images/stop.png");

    let st = selected_tests;
    selected_tests  = {}
    for(let concept_id in st){
      if(parseInt(concept_id) == parseInt(e.id))
        continue;

      selected_tests[concept_id] = st[concept_id];
    }
  }else{
    e.setAttribute("style","background-color: lightblue;");
    let img = document.getElementById(`checkbox-${e.id}`);
    img.setAttribute("src","../assets/images/checkmark.png");
    selected_tests[e.id] = e.concept_name;
  }
  
  
}

function loadSpecimen(){
  let clearButton = $("clearButton");
  clearButton.setAttribute("onmousedown","clearSelectInput();")
  let nextButton = $("nextButton");
  nextButton.setAttribute("onmousedown","validateInput();");

  var el = document.getElementById("inputFrame"  + tstCurrentPage);
  let estyle = "width: 95.5%; height: 90%;"
  estyle += "border-style: none; background-color: white;";
  el.style = estyle;

  let inputbox = `
    <div id="tests-area-div">
      <input type="text" id="select_test_input" />
      <div id="available-tests">
        <div id="options" class="scrollable" referstotouchscreeninputid="0">
        </div>
      </div>
      <div id="available-tests-keyboard"></div>
    </div>
  `;


  el.innerHTML = inputbox;
  addKeyboard();
  getAvailableSpecimen(selectedTest);
}

var fetchedTests;

function renderTests(tests){
  var options = $("options");
  options.innerHTML = "";
  fetchedTests = {};

  var ul = document.createElement("ul");
  options.appendChild(ul);
  
  for(let i = 0; i < tests.length; i++){
    ul.innerHTML += `
      <li tstvalue="${tests[i].name}" id="${tests[i].concept_id}" 
        onmousedown="null; updateSelectedTest(this);" class="li-tests"
        style="background-color: white;">${tests[i].name}</li>
    `;
    fetchedTests[tests[i].name] = tests[i].concept_id;
  }

  autoSelectRow();
}

function updateSelectedTest(el){
  let tests = document.getElementsByClassName("li-tests");
  let  inputBox = $("select_test_input");
  
  for(let i = 0; i < tests.length; i++){
    tests[i].style = "background-color: white;";
  }

  el.style = "background-color: lightblue;";
  inputBox.value  = el.getAttribute("tstvalue");
}

function addKeyboard(){
  let keyboardDIV = $("available-tests-keyboard");
  keyboardDIV.innerHTML = null;
  keysRow1 = ["1","2","3","4","5","6","7","8","9","0"];
  keysRow2 = ["Q","W","E","R","T","Y","U","I","O","P","A-Z"];
  keysRow3 = ["A","S","D","F","G","H","J","K","L","Delete"];
  keysRow4 = ["Z","X","C","V","B","N","M",",",".","Space"];

  let keys = [keysRow1, keysRow2, keysRow3, keysRow4];
  let span = document.createElement("span");
  span.setAttribute("class","qwertyKeyboard");
  keyboardDIV.appendChild(span);


  for(let i = 0; i < keys.length; i++){
    let s = document.createElement("span");
    s.setAttribute("class","buttonLine");
    span.appendChild(s);
    let keyBTNs = keys[i];

    for(let b = 0; b < keyBTNs.length; b++){
      let key = keyBTNs[b];
      if(key != "Delete" && key !== "Space"){
        if(caps_lock){
          key  = key.toUpperCase();
        }else{
          key = key.toLowerCase();
        }
      }
      let button = `<button onmousedown="keyPress('${key}');" 
      class="keyboardButton" id="${key}">
      <span>${key}</span></button>`;
      s.innerHTML += button;
    }

  }

}

var caps_lock = false;

function keyPress(key){
  let inputBox = $("select_test_input");
  let inputed_text = inputBox.value;

  if(key == "Delete"){
    let len = (inputed_text.length - 1);
    inputBox.value = inputed_text.substring(0, len);
  }else if(key == "Space"){
    inputBox.value += " ";
  }else if(key == "0-9"){
  }else if(key.toUpperCase() == "A-Z"){
    caps_lock = (caps_lock == false ? true : false);
    addKeyboard();
  }else{
    inputBox.value += key;
  }

  getAvailableSpecimen(inputBox.value);
}

function clearSelectInput(){
  let inputBox = $("select_test_input");
  inputBox.value = null;
  selectedTest = "";
  getAvailableSpecimen("");
}

function autoSelectRow(){
  let inputBox = $("select_test_input");
  if(inputBox.value == "")
    inputBox.value = selectedTest;

  let lists = document.getElementsByClassName("li-tests");

  for(let i = 0; i < lists.length; i++){
    if(lists[i].getAttribute("tstvalue").toLowerCase() == inputBox.value.toLowerCase()){
      lists[i].style = "background-color: lightblue;";
      inputBox.value = lists[i].getAttribute("tstvalue");
    }
  }
}

var selectedTest = "";

function validateInput(){
  let inputBox = $("select_test_input");
  let lists = document.getElementsByClassName("li-tests");

  for(let i = 0; i < lists.length; i++){
    if(lists[i].getAttribute("tstvalue").toLowerCase() == inputBox.value.toLowerCase()){
      selectedTest = inputBox.value;
      gotoNextPage();
      return;
    }
  }
  
  showMessage("Please select a validate test");
}

function loadPressedOrder(){
  var el = document.getElementById("inputFrame"  + tstCurrentPage);
  el.style = "width: 95.5%; overflow: auto;";
  
  el.innerHTML = `
  <table id="confirmation-table">
    <thead>
      <tr>
        <th class="indicators">Indicator</th>
        <th>Value</th>
      </tr>
    </theade>
    <tbody>
      <tr>
        <td class="indicators">Clinician</td>
        <td id="ordering-clinician">
          ${$("given_name").value} ${$("family_name").value}
        </td>
      </tr>
      <tr>
        <td class="indicators">Ordering Location</td>
        <td id="ordering-location">
        ${all_locations[parseInt($("location_name").value)]}
        </td>
      </tr>
      <tr>
        <td class="indicators">Order Reason</td>
        <td id="ordering-reason">
          ${$("reson_for_test").value}
        </td>
      </tr>
      <tr>
        <td class="indicators">Specimen</td>
        <td id="ordering-specimen">
          ${selectedTest}
        </td>
      </tr>
      <tr>
        <td class="indicators">Test(s)</td>
        <td id="ordering-tests"></td>
      </tr>
    </tbody>
  </table>`;
}

var all_locations = {};

function getLocations() {
  let url = apiProtocol + "://" + apiURL + ":" + apiPort + "/api/v1/locations?paginate=false";

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      let locations = JSON.parse(this.responseText);
      for(let i =0; i < locations.length; i++){
        all_locations[locations[i].location_id] = locations[i].name;
      }
    }
  };
  xhttp.open("GET", url, true);
  xhttp.setRequestHeader('Authorization', sessionStorage.getItem("authorization"));
  xhttp.setRequestHeader('Content-type', "application/json");
  xhttp.send();
}

getLocations();