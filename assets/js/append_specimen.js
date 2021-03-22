"use strict";

// requires state.js, utils.js

const {LAB_STATE_ID} = State;

async function loadSpecimens() {
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
  //console.log({compatibleSpecimens, incompatibleSpecimens});
  const inputFrame = document.querySelector(`#inputFrame${tstCurrentPage}`);
  const name = tests.map(({name}) => name).join('; ');
  
  if (!inputFrame) {
    console.warn('inputFrame not found');
    return;
  }
  
  //inputFrame.innerHTML = SpecimenSelect(name, compatibleSpecimens, incompatibleSpecimens);
  //loadEventHandlers();
  //console.log(compatibleSpecimens);
  let innerHTML = `<table id="specimen-table">`;
  //findPotentialSpecimens
  let even_odd = 'odd';
  let otherSpecimen = '';

  for(let i = 0; i < compatibleSpecimens.length; i++){
    even_odd = (even_odd == 'odd' ? 'even' : 'odd');
    let name = compatibleSpecimens[i].name;
    let concept_id = compatibleSpecimens[i].concept_id;
    if(name.match(/other/i)){
      otherSpecimen += `<tr class="${even_odd} specimen-rows" onclick="selectSpecimen(${concept_id});">
        <td class="checkboxes">${createCheckBox(concept_id)}</td>
        <td class="specimen-names">${name}</td>
      </tr>
    `;
      continue;
    }

    innerHTML += `<tr class="${even_odd} specimen-rows" onclick="selectSpecimen(${concept_id});">
        <td class="checkboxes">${createCheckBox(concept_id)}</td>
        <td class="specimen-names">${name}</td>
      </tr>
    `;
  }

  __$("helpText" + tstCurrentPage).innerHTML = `Select ${name} test specimen`;

  if(otherSpecimen.length > 0)
    innerHTML += otherSpecimen;


  inputFrame.innerHTML = innerHTML;
}

function createCheckBox(concept_id){
  return `<img class="checkboxIMG" click="selectSpecimen(${concept_id})" 
    id="checkbox-${concept_id}" src="/public/touchscreentoolkit/lib/images/unchecked.jpg" />`;
}

function selectSpecimen(concept_id){
  let checkboxes = document.getElementsByClassName('checkboxIMG');
  for(let i = 0; i < checkboxes.length; i++){
    checkboxes[i].setAttribute("src","/public/touchscreentoolkit/lib/images/unchecked.jpg");
  }
  __$(`checkbox-${concept_id}`).setAttribute("src","/public/touchscreentoolkit/lib/images/checked.jpg");
  selectedSpecimenID =  concept_id;
}

function SpecimenSelect(label, compatibleSpecimens, incompatibleSpecimens) {
  return `
    <fieldset>
      <legend>${label}</legend>
      ${compatibleSpecimens.map(specimen => SpecimenOption(specimen)).join('')}
      ${incompatibleSpecimens.map(({specimen, incompatibleTest}) => SpecimenOption(specimen, {incompatibleTest})).join('')}
    </fieldset>
  `
}

function SpecimenOption(specimen, {incompatibleTest} = {}) {
  const {concept_id, name} = specimen;
  incompatibleTest ||= false;

  return `
    <div class="specimen-input-group">
      <input id="specimen-option-${concept_id}"
             data-specimen-id="${concept_id}"
             type="checkbox"
             class="specimen-option"
             name="${name}"
             ${incompatibleTest ? 'disabled' : ''}>
      <label for="specimen-option-${concept_id}">
        <span ${incompatibleTest ? 'class="disabled"' : ''}>${name}</span>
        ${incompatibleTest ? `[Incompatible with ${incompatibleTest.name}]` : ''}
      </label>
    </div>
  `;
} 

function loadEventHandlers() {
  loadSpecimenInputHandlers();
  loadSubmitFormHandlers();
}

function loadSpecimenInputHandlers() {
  const specimenInputs = document.querySelectorAll('input.specimen-option');

  specimenInputs.forEach(input => {
    input.addEventListener("click", function(event) {
      const inputsToUncheck = document.querySelectorAll('input.specimen-option:checked');

      inputsToUncheck.forEach(inputToUncheck => {
        if (inputToUncheck.getAttribute('id') === input.getAttribute('id')) return;

        inputToUncheck.checked = false;
      });
    });
  });
}

function loadSubmitFormHandlers() {
  const nextButton = document.querySelector('#nextButton');
  nextButton.setAttribute('onmousedown', '');
  nextButton.addEventListener('mousedown', async function(_event) {
    try {
      const specimenId = selectedSpecimenID; // getSelectedSpecimen();
      const {order_id} = Utils.queryParams();

      if (!specimenId) {
        showMessage('Please select a specimen for the test');
        return;  
      }
      
      await updateOrder(order_id, {concept_id: specimenId});
      window.location.href = `/views/patient_dashboard.html?patient_id=${sessionStorage.patientID}`;
    } catch (exception) {
      console.error(exception);
      showMessage(exception.message);
    }
  });
  
  const cancelButton = document.querySelector('#cancelButton');
  cancelButton.setAttribute('onmousedown', '');
  cancelButton.addEventListener('mousedown', function(_event) {
    window.location.href = `/views/patient_dashboard.html?patient_id=${sessionStorage.patientID}`;
  });
}

function getSelectedSpecimen() {
  const input = document.querySelector('input.specimen-option:checked');
  
  if (!input) return null;

  return Number.parseInt(input.getAttribute('data-specimen-id'), 10);
}

async function updateOrder(orderId, params) {
  const response = await Utils.apiPut(`/orders/${orderId}`, params);
  const responseBody = await response.json();

  if (!response.ok) {
    throw new Error(`Failed to update order: ${Utils.formatApiError(responseBody)}`);
  }

  return responseBody;
}

