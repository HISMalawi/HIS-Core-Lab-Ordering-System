// require('utils')

async function fetchTests() {
  var nextButton = $("nextButton");
  nextButton.setAttribute("onmousedown","validateSelectedTest();");
  let url;

  if(selected_specimen_concept_name){
    url = Utils.expandApiPath(`lab/test_types?specimen_type=${selected_specimen_concept_name}`);
  }else{
    url = Utils.expandApiPath(`lab/test_types`);
  }

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && (this.status == 201 || this.status == 200)) {
      let tests = JSON.parse(this.responseText);
      let el = document.getElementById("inputFrame"  + tstCurrentPage);
      el.style = "width: 95.5%; height: 90%; overflow: auto;";
      el.innerHTML = null;
      
      const viralLoadIndex = tests.findIndex(({name}) => name.match(/Viral load/i));
      const viralLoad = viralLoadIndex >= 0 ? tests.splice(viralLoadIndex, 1)[0] : null;

      tests = tests.sort((test1, test2) => test1.name > test2.name);
      if (viralLoad) tests.unshift(viralLoad);

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
  url += "/lab/specimen_types?test_type=" + test_string;

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

  }
  
  for(let concept_id in selected_tests){
    let e = $(concept_id);
    selectTest(e);
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

    let selected_test_before = selected_tests;
    selected_tests  = {}
    for(let concept_id in selected_test_before){
      if(parseInt(concept_id) == parseInt(e.id))
        continue;

      selected_tests[concept_id] = selected_test_before[concept_id];
    }
  }else{
    e.setAttribute("style","background-color: lightblue;");
    let img = document.getElementById(`checkbox-${e.id}`);
    img.setAttribute("src","../assets/images/checkmark.png");
    selected_tests[e.id] = e.getAttribute("concept_name");
  }
  
  
}

function resetClearButton(){
  let clearButton = $("clearButton");
  clearButton.setAttribute("onmousedown","clearInput();")
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

var selected_specimen_concept_name;

function updateSelectedTest(el){
  let tests = document.getElementsByClassName("li-tests");
  let  inputBox = $("select_test_input");
  
  for(let i = 0; i < tests.length; i++){
    tests[i].style = "background-color: white;";
  }

  el.style = "background-color: lightblue;";
  inputBox.value  = el.getAttribute("tstvalue");
  selected_specimen_concept_name = el.innerHTML;
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
      selected_tests = {};
      gotoNextPage();
      return;
    }
  }
  
  showMessage("Please select a validate test");
}

function loadPressedOrder(){
  var el = document.getElementById("inputFrame"  + tstCurrentPage);
  el.style = "width: 95.5%; overflow: auto;";
  let selected_text_html = [];

  for(let concept_id in selected_tests){
    selected_text_html.push(selected_tests[concept_id]);
  }

  let combine_test_in_order;
  let nextButton = $("nextButton");
  nextButton.setAttribute("onmousedown","createEncounter('submitOrder');");

  if(showCombineTest()){
    combine_test_in_order = $("combine_test_in_order").value;
  }else{
    combine_test_in_order = 'No';
  }

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
        <td class="indicators">Ordering Clinician</td>
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
        <td id="ordering-tests">
          ${selected_text_html.join("<br />")}
        </td>
      </tr>
      <tr>
        <td class="indicators">Combine Test(s) in  one order</td>
        <td id="ordering-tests">${combine_test_in_order}</td>
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

function validateSelectedTest(){
  if(Object.keys(selected_tests).length < 1){
    showMessage("Please select test(s) to continue.");
    return;
  }

  gotoNextPage();  
}

function resetNextButton(){
  let nextButton = $("nextButton");
  nextButton.setAttribute("onmousedown","gotoNextPage();");
}

function createEncounter(nextFunction){
  if(isNaN(parseInt(sessionStorage.patientID))){
    showMessage("Something has gone wrong. Patient <b>NOT</b> found.<p>Try scanning the client's barcode again.")
    return;
  }

  let currentTime = moment().format(' HH:mm:ss');
  let encounter_datetime = moment(sessionStorage.sessionDate).format('YYYY-MM-DD');
  encounter_datetime += currentTime;

  let encounter = {
      encounter_type_id: 57,
      patient_id: sessionStorage.patientID,
      encounter_datetime: encounter_datetime
  }

  submitParameters(encounter, "/encounters", nextFunction);

}

function submitOrder(encounter) {
  let clinician_name = `${$("given_name").value} ${$("family_name").value}`;
  let ordering_loc = `${all_locations[parseInt($("location_name").value)]}`;
  let ordering_reason = $("reson_for_test").value;
  let combine_test_in_order  = showCombineTest();
  if(combine_test_in_order){
    combine_test_in_order = ($("combine_test_in_order").value == 'Yes' ? true : false);
  }else{
    combine_test_in_order = false;
  }


  let specimen_id = fetchedTests[selectedTest];
  let selected_tests_concept_ids = [];

  let order_obj = {
    clinician_name: clinician_name,
    ordering_location: ordering_loc,
    ordering_reason:  432,
    specimen_id: specimen_id
  }

  for(concept_id  in selected_tests){
    selected_tests_concept_ids.push({concept_id: concept_id});
  }

  let order_param = createOrderObj(encounter, order_obj, selected_tests_concept_ids, combine_test_in_order);
  postOrder(order_param);
}

function createOrderObj(encounter, order_obj, tests, combine_tests) {
  if(combine_tests){
    let orders = {
      orders: [
        {
          "encounter_id": encounter.encounter_id,
          "specimen": {
            "concept_id": order_obj.specimen_id
          },
          "tests": tests,
          "date": encounter.encounter_datetime,
          "requesting_clinician": order_obj.clinician_name,
          "target_lab": order_obj.ordering_location,
          "reason_for_test_id": order_obj.ordering_reason
        }
      ]
    }
    return orders;
  }else{
    let orders = {orders: []}
    for(let i = 0; i < tests.length; i++){
      orders.orders.push({
          "encounter_id": encounter.encounter_id,
          "specimen": {
          "concept_id": order_obj.specimen_id
        },
          "tests": [tests[i]],
          "date": encounter.encounter_datetime,
          "requesting_clinician": order_obj.clinician_name,
          "target_lab": order_obj.ordering_location,
          "reason_for_test_id": order_obj.ordering_reason
        });
    }
    return orders;
  }
}

function postOrder(orders){
  var url = apiProtocol+ '://' + apiURL + ':' + apiPort + '/api/v1/lab/orders';

  var req = new XMLHttpRequest();
  req.onreadystatechange = function () {
      if (this.readyState == 4) {
          if (this.status == 201) {
            let orders = JSON.parse(this.responseText);
            let order_ids = [];
            for(let i = 0; i < orders.length; i++){
              order_ids.push(orders[i].order_id);
            }
            if(document.URL.match(/order.html/i)){
              window.location = '/views/patient_dashboard.html?patient_id=' + sessionStorage.patientID;
            }else{
              window.location = `print/label.html?order_ids=${order_ids.join(',')}`;
            }
          }
      }
  };

  req.open("POST", url, true);
  req.setRequestHeader('Authorization', sessionStorage.getItem("authorization"));
  req.setRequestHeader('Content-type', "application/json");
  req.send(JSON.stringify(orders));

}

async function submitIncompleteOrder(encounter) {
  const requesting_clinician = sessionStorage.username;
  const target_lab = all_locations[parseInt($("location_name").value)];
  const ordering_reason = getTestReason(__$("reson_for_test").value);
  const tests = Object.keys(selected_tests).map(concept_id => ({concept_id}));

  let orders;
  let combine_tests_in_one_order;

  if(showCombineTest()){
    combine_tests_in_one_order = $('combine_tests_in_one_order').value == 'Yes' ? true : false;
  }else{ 
    combine_tests_in_one_order = false;
  }

  if (combine_tests_in_one_order) {
    orders = [
      {
        encounter_id: encounter.encounter_id,
        date: sessionStorage.sessionDate,
        reason_for_test_id: ordering_reason,
        requesting_clinician: requesting_clinician,
        target_lab: target_lab,
        tests
      }
    ];
  } else {
    orders = tests.map(test => ({
      encounter_id: encounter.encounter_id,
      date: sessionStorage.sessionDate,
      reason_for_test_id: ordering_reason,
      requesting_clinician: requesting_clinician,
      target_lab: target_lab,
      tests: [test]
    }));
  }

  postOrder({orders});
}

function loadOrder(){
  var el = document.getElementById("inputFrame"  + tstCurrentPage);
  el.style = "width: 95.5%; overflow: auto;";
  let selected_text_html = [];

  for(let concept_id in selected_tests){
    selected_text_html.push(selected_tests[concept_id]);
  }

  let nextButton = $("nextButton");
  nextButton.setAttribute("onmousedown","createEncounter('submitIncompleteOrder');");

  el.innerHTML = `
  <table id="confirmation-table">
    <thead>
      <tr>
        <th class="indicators">Indicator</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="indicators">Ordering provider username</td>
        <td id="ordering-clinician">
          ${sessionStorage.username}
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
        <td class="indicators">Test(s)</td>
        <td id="ordering-tests">
          ${selected_text_html.join("<br />")}
        </td>
      </tr>
    </tbody>
  </table>`;
}

function getTestReason(selected_reason){
  let reasons = {
      "Repeat / Missing": 9144,
      "Targeted": 3280,
      "Confirmatory": 1345,
      "Stat": 6368,
      "Routine": 432
  };

  return reasons[selected_reason];
}

function showCombineTest(){
  let tests = [];
  for(concept_id in selected_tests){
    tests.push(concept_id);
  }

  return (tests.length > 1 ? true : false);
}

getLocations();