"use strict";

// requires state.js, utils.js

const {LAB_STATE_ID} = State;

async function loadSpecimens() {
  __$('nextButton').setAttribute("onmousedown","loadSubmitFormHandlers();")

  try {
    const order = getSelectedOrder();
    
    if (!order) {
      Utils.flashErrorAndRedirectToHome('Order not found!');
      return;
    }
    
    const specimens = await findPotentialSpecimens(order.tests);

    updateView({tests: order.tests, ...specimens});
  } catch(exception) {
    console.error(exception);
    showMessage(exception.message);
  } 
}

function getSelectedOrder() {
    const params = Utils.queryParams();
    const {orders} = State.get(LAB_STATE_ID) || {};
    
    if (!orders) return null;

    return orders.find(order => order.order_id == params['order_id']);
}

async function findPotentialSpecimens(tests) {
  const specimensForTests = await Promise.all(tests.map(getSpecimensForTest));  // Array of arrays of specimens for each test
  const compatibleSpecimens = Utils.arrayIntersection(compareSpecimens, ...specimensForTests);
  let incompatibleSpecimens = specimensForTests.flatMap(specimens => {
    return Utils.arrayDifference(compareSpecimens, specimens, compatibleSpecimens)
  });
  incompatibleSpecimens = Utils.arrayCompact(({concept_id}) => concept_id,  incompatibleSpecimens)
                               .map(specimen => {
                                  return {
                                    specimen,
                                    incompatibleTest: findIncompatibleTest(specimen, tests, specimensForTests)
                                  }
                               });
  
  return {compatibleSpecimens, incompatibleSpecimens};
}

async function getSpecimensForTest(test) {
  const response = await Utils.apiGet(`lab/specimen_types?test_type=${test.name}`);
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to retrieve specimens: ${Utils.formatApiError(responseBody)}`);
  }
  
  return responseBody;
}

const compareSpecimens = (specimenA, specimenB) =>  specimenA.concept_id === specimenB.concept_id;

function findIncompatibleTest(specimen, tests, specimenGroups) {
  for (const [test, specimens] of Utils.zipArrays(tests, specimenGroups)) {
    if (!specimens.find(testSpecimen => testSpecimen.concept_id === specimen.concept_id)) {
      return test;
    }
  }

  return null;
}

let selectedSpecimenID;

function updateView({tests, compatibleSpecimens, incompatibleSpecimens}) {
  __$('nextButton').setAttribute("onmousedown","loadSubmitFormHandlers();")
  const inputFrame = document.querySelector(`#inputFrame${tstCurrentPage}`);
  const name = tests.map(({name}) => name).join('; ');
  
  if (!inputFrame) {
    console.warn('inputFrame not found');
    return;
  }
  
  let innerHTML = `<table id="specimen-table">`;
  let even_odd = 'odd';
  let otherSpecimen = '';


  let specimenDIV = '<div class="specimen-main">';
  let sorted_names = [];

  for(let i = 0; i < compatibleSpecimens.length; i++){
    sorted_names.push(compatibleSpecimens[i].name);
  }

  sorted_names = sorted_names.sort();

  for(let s = 0; s < sorted_names.length; s++){
    for(let i = 0; i < compatibleSpecimens.length; i++){
      let name = compatibleSpecimens[i].name;
      if(name != sorted_names[s])
        continue;

      let concept_id = compatibleSpecimens[i].concept_id;
      if(name.match(/other/i)){
        otherSpecimen += `<div class="specimen-row" id="row-${concept_id}"
          onmousedown="selectSpecimen(${concept_id});">
          <div class="specimen-cell">${name}</div>
        </div>`;
        continue;
      }
      specimenDIV += `<div class="specimen-row" id="row-${concept_id}"
        onmousedown="selectSpecimen(${concept_id});">
        <div class="specimen-cell">${name}</div>
      </div>`;
    }
  }
  __$("helpText" + tstCurrentPage).innerHTML = `Select ${name} test specimen`;


  if(otherSpecimen.length > 0)
    specimenDIV += otherSpecimen;

  inputFrame.innerHTML = specimenDIV;
}

function selectSpecimen(concept_id){
  let rows = document.getElementsByClassName('specimen-row');
  for(let i = 0; i < rows.length; i++){
    rows[i].setAttribute("style","background-color: '';");
  }
  __$(`row-${concept_id}`).setAttribute("style","background-color: lightblue;");
  selectedSpecimenID =  concept_id;
}

function loadSubmitFormHandlers() {

  if (!selectedSpecimenID) {
    showMessage('Please select a specimen for the test');
    return;  
  }
  
  let param = {specimen: { concept_id: selectedSpecimenID } };

  let url_path = apiProtocol+ '://' + apiURL + ':' + apiPort + `/api/v1/lab/orders/${order_id}`;
  let req = new XMLHttpRequest();
  req.onreadystatechange = function () {
      if (this.readyState == 4) {
          if (this.status == 200) {
            window.location.href = `print/label.html?order_ids=${order_id}`;
          }
      }
  };

  req.open("PUT", url_path, true);
  req.setRequestHeader('Authorization', sessionStorage.getItem("authorization"));
  req.setRequestHeader('Content-type', "application/json");
  req.send(JSON.stringify(param));
}

var url = window.location.href;
var url = new URL(url);
var order_id = url.searchParams.get("order_id");