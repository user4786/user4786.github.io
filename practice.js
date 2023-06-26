/**
 * Makes requests to the piano notes API to display a line of music note images for
 * users to practice sight reading with. Controls the sight reading game.
 * Makes the keyboard on practice.html playable and the sidebar and buttons clickable.
 * Audio from https://github.com/fuhton/piano-mp3/blob/master/piano-mp3/Gb7.mp3
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  const BASE_URL = "https://sight-reading-api.onrender.com/";
  let currentClef;
  let numNotes = 8;
  let notesToPractice = [];
  let numWrong;
  let startTime;

  /**
   * Makes the piano keys, start button, key names slider clickable.
   * Displays ten music notes.
   */
  function init() {
    id("start-btn").addEventListener("click", startPractice);
    let keysCheckbox = qs(".keys-checkbox input");
    keysCheckbox.addEventListener("click", showHideKeys);
    let pianoKeys = qsa(".white");
    for (let i = 0; i < pianoKeys.length; i++) {
      pianoKeys[i].addEventListener("click", handleKeyboardClick);
    }
    let allPianoKeys = qsa(".key");
    for (let i = 0; i < allPianoKeys.length; i++) {
      allPianoKeys[i].addEventListener("click", playNote);
    }
    startPractice();
  }

  /**
   * Plays the sound corresponding to the key that was clicked.
   * @param {*} evt - The key that was clicked.
   */
  function playNote(evt) {
    let audio = new Audio();
    let key = evt.currentTarget;
    audio.src = "audio/" + key.id.charAt(0).toUpperCase() + key.id.slice(1) + ".mp3";
    audio.play();
  }

  /** Creates a new sheet of music and displays it on the page. */
  function startPractice() {
    id("quiz-image").classList.add("hidden");
    id("quiz-image").innerHTML = "";
    id("practice-view").classList.add("hidden");
    qs(".keyboard-input").classList.remove("hidden");
    id("practice-stats").classList.add("hidden");
    numWrong = 0;
    // id("sight-reading-selection-view").classList.add("hidden");
    let clefChoice = qs("input:checked");
    currentClef = clefChoice.value;
    changeKeyboard(currentClef);
    createMusicSheet();
  }

  /** Creates a line of music notes and displays it on the webpage. */
  async function createMusicSheet() {
    let clefImage = gen("img");
    clefImage.src = "img/" + currentClef + "-clef-staff.png";
    clefImage.alt = currentClef;
    clefImage.classList.add("note-image");
    clefImage.classList.add("colored-background");
    id("quiz-image").appendChild(clefImage);
    for (let i = 0; i < numNotes; i++) {
      try {
        await getMusicNote(currentClef);
      } catch {
        handleError();
      }
    }
    id("quiz-image").classList.remove("hidden");
    id("practice-view").classList.remove("hidden");
    startTime = new Date();
  }

  /**
   * Gets a random music note.
   * @param {String} clef - The clef (either treble or bass).
   */
  async function getMusicNote(clef) {
    try {
      let response = await fetch(BASE_URL + "piano/random");
      await statusCheck(response);
      let responseJson = await response.json();
      addNoteToScreen(responseJson, clef);
    } catch {
      handleError();
    }
  }

  /**
   * Adds the note described in the given noteData in the given clef to the screen.
   * @param {*} noteData - Data about the note (image filename, note name)
   * @param {*} clef - The clef (treble or bass).
   */
  function addNoteToScreen(noteData, clef) {
    let noteImage = gen("img");
    noteImage.src = "img/" + noteData.filename;
    noteImage.alt = noteData[clef];
    // to deal with note repeats
    noteImage.classList.add(noteData[clef] + "-image");
    noteImage.classList.add("note-image");
    let checkmark = gen("img");
    checkmark.src = "img/checkmark.png";
    checkmark.alt = "checkmark";
    checkmark.classList.add("checkmark");
    checkmark.classList.add("hidden");
    let noteDiv = gen("div");
    noteDiv.appendChild(noteImage);
    noteDiv.appendChild(checkmark);
    let quizImage = id("quiz-image")
    quizImage.append(noteDiv);
    notesToPractice.push(noteData[clef]);
  }

  /**
   * Changes the keyboard to match the given clef.
   * @param {*} clef - The clef (treble or bass).
   */
  function changeKeyboard(clef) {
    let bassNotes = qsa(".bass");
    let trebleNotes = qsa(".treble");
    if (clef == "treble") {
      for (let i = 0; i < bassNotes.length; i++) {
        bassNotes[i].classList.add("hidden");
      }
      for (let i = 0; i < trebleNotes.length; i++) {
        trebleNotes[i].classList.remove("hidden");
      }
    } else {
      for (let i = 0; i < trebleNotes.length; i++) {
        trebleNotes[i].classList.add("hidden");
      }
      for (let i = 0; i < bassNotes.length; i++) {
        bassNotes[i].classList.remove("hidden");
      }
    }
  }

  // Shows or hides the note names on the keyboard.
  function showHideKeys() {
    let pianoKeys = qsa(".piano-keys .key");
    for (let i = 0; i < pianoKeys.length; i++) {
      if (pianoKeys[i].id != "c4") {
        // hides the span element
        pianoKeys[i].firstChild.classList.toggle("hidden");
      }
    }
  }

  /**
   * Identifies whether the correct key was clicked. If yes, displays a checkmark
   * under the note and moves on to the next note. If no, makes the key red for
   * 2 seconds.
   * @param {*} evt - The key that was clicked
   */
  function handleKeyboardClick(evt) {
    let currentNote = notesToPractice[0];
    let key = evt.currentTarget;
    if (key.id == currentNote) {
      key.classList.add("correct");
      let noteImage = qs("." + currentNote + "-image")
      qs(".checkmark.hidden").classList.remove("hidden");
      // In case of duplicate note later
      noteImage.classList.remove(currentNote + "-image");
      setTimeout(() => {
        key.classList.remove("correct");
      }, 250);
      // remove first element of notesToPractice array
      notesToPractice.shift();
      if (notesToPractice.length == 0) {
        let endTime = new Date();
        let ms_elapsed = endTime - startTime;
        setTimeout(() => {
          showStats(Math.round(ms_elapsed / 1000));
        }, 100);
      }
    } else {
      key.classList.add("wrong");
      numWrong = numWrong + 1;
      // return key to original color after 200 ms
      setTimeout(() => {
        key.classList.remove("wrong");
      }, 200);
    }
  }

  /**
   * Shows some statistics, including the time taken.
   * @param {*} timeTaken - the time the user took to finish the practice.
   */
  function showStats(timeTaken) {
    qs(".keyboard-input").classList.add("hidden");
    id("num-wrong-practice").textContent = numWrong;
    id("time-taken").textContent = timeTaken;
    id("practice-stats").classList.remove("hidden");
  }

  /** Displays an error message on the webpage. */
  function handleError() {
    id("error-message").classList.remove("hidden");
  }

  /**
   * Throws an error if the given response is not ok.
   * @param {object} response The response from a fetch request.
   * @returns {object} The response from a fetch request.
   */
  async function statusCheck(response) {
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response;
  }

  /**
   * Shortcut function from lecture for accessing nodes with a CSS selector.
   * @param {string} selector - The CSS selector for the collection of nodes.
   * @returns {NodeList} A list of all the html elements selected by the given selector
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Shortcut function from lecture for accessing one node with a CSS selector.
   * @param {string} selector - The CSS selector for the node.
   * @returns {HTMLElement} The first html element selected by the given selector.
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Shortcut function from lecture for accessing an element by id.
   * @param {string} id - The id of the element.
   * @returns {HTMLElement} The html element with the given id.
   */
  function id(id) {
    return document.getElementById(id);
  }

  /**
   * Shortcut function from lecture for creating new DOM elements.
   * @param {string} tagName - The name of the html tag.
   * @returns {HTMLElement} An empty DOM node with type tagName.
   */
  function gen(tagName) {
    return document.createElement(tagName);
  }
})();