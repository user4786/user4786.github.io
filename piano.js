/**
 * Makes requests to the piano notes API to display a music note images for
 * users to learn by clicking the corresponding key on the page's keyboard. Advances
 * to the next note once the correct key is clicked
 * Makes the keyboard on practice.html playable and the sidebar and buttons clickable.
 * Audio from https://github.com/fuhton/piano-mp3/blob/master/piano-mp3/Gb7.mp3
 */

"use strict";
(function() {
  window.addEventListener("load", init);
  const BASE_URL = "https://sight-reading-api.onrender.com/";
  let option1 = ["e3", "f3", "g3", "a3", "b3", "c4"];
  let option2 = ["c4", "d4", "e4", "f4", "g4", "a4", "b4", "c5"];
  let option3 = ["c5", "d5", "e5", "f5", "g5", "a5", "b5", "c6"];
  let option4 = ["c6", "d6", "e6", "f6"];
  let option5 = ["g1", "a1", "b1", "c2"];
  let option6 = ["c2", "d2", "e2", "f2", "g2", "a2", "b2", "c3"];
  let option7 = ["c3", "d3", "e3", "f3", "g3", "a3", "b3", "c4"];
  let option8 = ["c4", "d4", "e4", "f4", "g4", "a4"];
  let currentSet;
  let currentSetImages;
  let currentClef;
  let timerId;

  /** Makes the piano keys, key names slider, and options buttons clickable. */
  function init() {
    let keysCheckbox = qs(".keys-checkbox input");
    keysCheckbox.addEventListener("click", showHideKeys);
    let allPianoKeys = qsa(".key");
    for (let i = 0; i < allPianoKeys.length; i++) {
      allPianoKeys[i].addEventListener("click", playNoteOnPiano);
      allPianoKeys[i].addEventListener("click", handleLearnKeyboardClick)
    }
    let choiceButtons = qsa("#settings button");
    for (let i = 0; i < choiceButtons.length; i++) {
      choiceButtons[i].addEventListener("click", getNotes);
    }
    id("again-btn").addEventListener("click", learnAgain);
  }

  /**
   * Plays the piano note corresponding to the piano key that was clicked.
   * @param {HTMLElement} evt - Event object passed to the event listener.
   */
  function playNoteOnPiano(evt) {
    let key = evt.currentTarget;
    playNote(key.id);
  }

  /** Plays audio of the note with the given noteName. */
  function playNote(noteName) {
    let audio = new Audio();
    audio.src = "audio/" + noteName.charAt(0).toUpperCase() + noteName.slice(1) + ".mp3";
    audio.play();
  }

  /** Shows or hides the note names on the keyboard. */
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
   * Gets the next note based on which option the user chose and displays it.
   * @param {HTMLElement} evt - Event object passed to the event listener when a
   * button for the range options is clicked.
   */
  async function getNotes(evt) {
    clearInterval(timerId);
    resetProgressBar();
    let previousChoice = qs(".current-choice");
    if (previousChoice != null) {
      previousChoice.classList.remove("current-choice");
    }
    evt.currentTarget.classList.add("current-choice");
    let option = evt.currentTarget.id;
    dealWithOptions(option);
    id("num-total").textContent = currentSet.length;
    if (evt.currentTarget.classList.contains("treble-option")) {
      currentClef = "treble";
    } else {
      currentClef = "bass";
    }
    try {
      await getNotesHelper();
    } catch {
      handleError();
    }
  }

  /** Resets the progress bar back to zero and hides the ending text. */
  function resetProgressBar() {
    id("num-done").textContent = 0;
    qs(".progress-bar").style.width = 0;
    resetKeyandImage();
    qs("#learn-ending-text p").classList.add("hidden");
    qs("#learn-ending-text button").classList.add("hidden");
  }

  /**
   * Identifies which note range option was chosen.
   * @param {String} option - The name of the chosen option.
   */
  function dealWithOptions(option) {
    if (option == "option1") {
      currentSet = option1.slice();
    } else if (option == "option2") {
      currentSet = option2.slice();
    } else if (option == "option3") {
      currentSet = option3.slice();
    } else if (option == "option4") {
      currentSet = option4.slice();
    } else if (option == "option5") {
      currentSet = option5.slice();
    } else if (option == "option6") {
      currentSet = option6.slice();
    } else if (option == "option7") {
      currentSet = option7.slice();
    } else {
      currentSet = option8.slice();
    }
  }

  /** Gets the correct music notes in a random order. */
  async function getNotesHelper() {
    changeKeyboard(currentClef);
    currentSetImages = [];
    shuffleArray(currentSet);
    for (let i = 0; i < currentSet.length; i++) {
      try {
        await getMusicNote(currentClef, currentSet[i]);
      } catch {
        handleError();
      }
    }
    setUpQuestion();
    id("learn-intro").classList.add("hidden");
    qs(".container").classList.remove("hidden");
    qs("#progress-info p").classList.remove("hidden");
    id("learn-explanation").classList.remove("hidden");
  }

  /** Sets up the images and displays them on the webpage. */
  function setUpQuestion() {
    if (currentSet.length > 0) {
      resetKeyandImage();
      let noteName = currentSet[0];
      let existingImages = qsa(".note-image");
      let clefImage;
      let noteImage;
      if (existingImages[0] != null) {
        clefImage = existingImages[0];
        noteImage = existingImages[1];
      } else {
        clefImage = gen("img");
        noteImage = gen("img");
      }
      clefImage.src = "img/" + currentClef + "-clef-staff.png";
      clefImage.alt = currentClef;
      clefImage.classList.add("note-image");
      noteImage.src = "img/" + currentSetImages[0];
      noteImage.alt = noteName;
      noteImage.classList.add("note-image");
      let learnImage = id("learn-image");
      if (existingImages[0] != null) {
        learnImage.replaceChild(clefImage, learnImage.children[0]);
        learnImage.replaceChild(noteImage, learnImage.children[1]);
      } else {
        learnImage.appendChild(clefImage);
        learnImage.appendChild(noteImage);
      }
      learnImage.classList.remove("hidden");
      let noteNamesText = qsa(".learn-note-name");
      for (let i = 0; i< noteNamesText.length; i++) {
        noteNamesText[i].textContent = noteName.toUpperCase();
      }
      playNote(noteName);
      id(noteName).classList.add("correct");
      currentSet.shift();
      currentSetImages.shift();
    } else {
      id("learn-explanation").classList.add("hidden");
      qs("#learn-ending-text p").classList.remove("hidden");
      qs("#learn-ending-text button").classList.remove("hidden");
    }
  }

  /** Resets the quiz so that the user can learn the previous set of notes again. */
  function learnAgain() {
    resetProgressBar();
    let currentOption = qs("#settings .current-choice").id;
    dealWithOptions(currentOption);
    getNotesHelper();
  }

  /** Removes the current image and resets any green key back to white. */
  function resetKeyandImage() {
    // id("learn-image").innerHTML = "";
    let previousGreenNote = qs(".correct");
    if (previousGreenNote != null) {
      previousGreenNote.classList.remove("correct");
      previousGreenNote.addEventListener("click", handleLearnKeyboardClick);
    }
  }

  /**
   * Gets the filename for the image of the given note in the given clef.
   * @param {String} clef - the clef (either treble or bass).
   * @param {String} note - the name of the note.
   */
  async function getMusicNote(clef, note) {
    try {
      let filenameResponse = await fetch(BASE_URL + "piano/" + clef + "/" + note);
      await statusCheck(filenameResponse);
      let fileNameJson = await filenameResponse.json();
      currentSetImages.push(fileNameJson[0].filename);
    } catch {
      handleError();
    }
  }

  /**
   * Changes the color of the clicked key to red or green.
   * @param {HTMLElement} evt - Event object passed to the event listener when a
   * key on the keyboard is clicked.
   */
  function handleLearnKeyboardClick(evt) {
    let key = evt.currentTarget;
    if (key.classList.contains("correct")) {
      key.removeEventListener("click", handleLearnKeyboardClick);
      id("num-done").textContent = parseInt(id("num-done").textContent) + 1;
      let widthPercentage = parseInt(id("num-done").textContent) / parseInt(id("num-total").textContent) * 100;
      qs(".progress-bar").style.width = widthPercentage + "%";
      timerId = setTimeout(() => {
        setUpQuestion();
      }, 2000);
    } else {
      key.classList.add("wrong");
      // return key to original color after 200 ms
      setTimeout(() => {
        key.classList.remove("wrong");
      }, 200);
    }
  }

  /**
   * Shuffles the given array.
   * @param {Array} arr - the given array
   */
  function shuffleArray(arr) {
     // From https://www.w3docs.com/snippets/javascript/how-to-randomize-shuffle-a-javascript-array.html
    arr.sort(() => Math.random() - 0.5);
  }

  /**
   * Changes the keyboard based on the given clef.
   * @param {String} clef - the clef (treble or bass).
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