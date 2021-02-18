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
  incompatibleSpecimens = Utils.arrayCompact(({concept_id}) => concept_id,  incompatibleSpecimens);
  
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

function updateView({tests, compatibleSpecimens, incompatibleSpecimens}) {
  console.log({compatibleSpecimens, incompatibleSpecimens});
  const inputFrame = document.querySelector(`#inputFrame${tstCurrentPage}`);
  const name = tests.map(({name}) => name).join('; ');
  
  if (!inputFrame) {
    console.warn('inputFrame not found');
    return;
  }
  
  inputFrame.innerHTML = SpecimenSelect(name, compatibleSpecimens, incompatibleSpecimens);
  loadEventHandlers();
}

function SpecimenSelect(label, compatibleSpecimens, incompatibleSpecimens) {
  return `
    <fieldset>
      <legend>${label}</legend>
      ${compatibleSpecimens.map(specimen => SpecimenOption(specimen)).join('')}
      ${incompatibleSpecimens.map(specimen => SpecimenOption(specimen, {disabled: true})).join('')}
    </fieldset>
  `
}

function SpecimenOption(specimen, {disabled} = {}) {
  const {concept_id, name} = specimen;
  disabled ||= false;

  return `
    <div>
      <input id="specimen-option-${concept_id}"
             data-specimen-id="${concept_id}"
             type="checkbox"
             class="specimen-option"
             name="${name}"
             ${disabled ? 'disabled' : ''}>
      <label for="specimen-option-${concept_id}">
        <span ${disabled ? 'class="disabled"' : ''}>${name}</span>${disabled ? '[Incompatible with some of the selected tests]' : ''}
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
      const specimenId = getSelectedSpecimen();
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

