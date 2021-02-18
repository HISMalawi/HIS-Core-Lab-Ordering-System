"use strict";

var State = (function() {
    const LAB_STATE_ID = 'Lab';

    /**
     * Session storage backed basic state management for the lab module.
     */

    const Storage = sessionStorage; // We can swap localStorage if need be
    
    console.log(Storage.moduleState);
    
    function deserializeState(state) {
        try {
            return JSON.parse(state);
        } catch(e) {
            console.log(`Failed to deserialize state: ${e}`);
            return {};
        }
    }

    const state = Storage.moduleState ? deserializeState(Storage.moduleState) : {};

    const getPatient = () => Storage.patientID;

    function update(name, newState) {
        state[name] = {
            userState: newState,
            scope: getPatient()  // This state is only valid when this patient is loaded
        };
        persistState();
    }

    function clear(name) {
        state[name] = null;
        persistState();
    }

    function get(name) {
        const {scope, userState} = state[name]; 
        
        if (scope != getPatient()) return null;  // Wouldn't it more sensible to throw an exception?
        
        return userState;
    }

    function persistState() {
        Storage.moduleState = JSON.stringify(state);
    }

    return { LAB_STATE_ID, clear, get, update };
})();
