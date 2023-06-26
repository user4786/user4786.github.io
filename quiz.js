/**
 * Makes requests to the piano notes API to display images of different music notes
 * and quiz users on music notes. Makes the keyboard on practice.html playable and the
 * sidebar and buttons clickable.
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
  let chosenOption = "all";
  let currentNote;
  let currentClef;
  let numAttempts = 0;
  let timerId;

  /**
   * Makes the piano keys, show key names slider, and other buttons clickable
   * and displays the first question.
   * */
  function init() {
    currentClef = "treble";
    let keysCheckbox = qs(".keys-checkbox input");
    keysCheckbox.addEventListener("click", showHideKeys);
    getRandomMusicNote("treble");
    let allPianoKeys = qsa(".key");
    for (let i = 0; i < allPianoKeys.length; i++) {
      allPianoKeys[i].addEventListener("click", playNote);
    }
    let choiceButtons = qsa("#settings button");
    for (let i = 0; i < choiceButtons.length; i++) {
      choiceButtons[i].addEventListener("click", changeOption);
    }
    // no sharps or flats yet
    id("next-btn").addEventListener("click", loadNextQuestion);
    id("quiz-view").classList.remove("hidden");
  }

  /**
   * Plays the piano note corresponding to the piano key that was clicked.
   * @param {HTMLElement} evt - Event object passed to the event listener.
   */
  function playNote(evt) {
    let audio = new Audio();
    let key = evt.currentTarget;
    audio.src = "audio/" + key.id.charAt(0).toUpperCase() + key.id.slice(1) + ".mp3";
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
   * Change the range of notes to be quizzed on to the user-selected range.
   * @param {HTMLElement} evt - Event object passed to the event listener.
   */
  function changeOption(evt) {
    if (timerId != null) {
      clearInterval(timerId);
    }
    hideQuizCorrectView();
    if (id(currentNote) != null) {
      id(currentNote).classList.remove("correct");
    }
    id("quiz-image").classList.add("hidden");
    numAttempts = 0;
    id("quiz-image").innerHTML = "";
    let previousChoice = qs(".current-choice");
    if (previousChoice != null) {
      previousChoice.classList.remove("current-choice");
    }
    evt.currentTarget.classList.add("current-choice");
    chosenOption = evt.currentTarget.id;
    if (chosenOption == "all") {
      handleAllNotesOption();
    } else {
      if (evt.currentTarget.classList.contains("treble-option")) {
        currentClef = "treble";
      } else {
        currentClef = "bass";
      }
      dealWithOptions();
    }
  }

  /** Identifies which note range option was chosen. */
  function dealWithOptions() {
    let option;
    if (chosenOption == "option1") {
      option = option1;
    } else if (chosenOption == "option2") {
      option = option2;
    } else if (chosenOption == "option3") {
      option = option3;
    } else if (chosenOption == "option4") {
      option = option4;
    } else if (chosenOption == "option5") {
      option = option5;
    } else if (chosenOption == "option6") {
      option = option6;
    } else if (chosenOption == "option7") {
      option = option7;
    } else {
      option = option8;
    }
    currentNote = option[Math.floor(Math.random() * option.length)]
    getSpecificNote();
    changeKeyboard(currentClef);
  }

  /**
   * Gets a random music note and uses it to create a question with the given clef.
   * @param {String} clef - The clef of the note
   */
  function getRandomMusicNote(clef) {
    fetch(BASE_URL + "piano/random")
      .then(statusCheck)
      .then(resp => resp.json())
      .then(function(resp) {
        createQuestion(resp, clef);
      })
      .catch(handleError);
  }

  /** Gets a specific music note and uses it to create a question. */
  function getSpecificNote() {
    fetch(BASE_URL + "piano/" + currentClef + "/" + currentNote)
      .then(statusCheck)
      .then(resp => resp.json())
      .then(function(resp) {
        createQuestion(resp[0], currentClef);
      })
      .catch(handleError);
  }

  /**
   * Creates a quiz question for the note described in the given noteData matching the given clef.
   * @param {} noteData
   * @param {String} clef - the clef (treble or bass)
   */
  function createQuestion(noteData, clef) {
    let pianoKeys = qsa(".white");
    for (let i = 0; i < pianoKeys.length; i++) {
      pianoKeys[i].addEventListener("click", handleKeyboardClick);
    }
    if (chosenOption == "all") {
      currentNote = noteData[clef];
    }
    let clefImage = gen("img");
    clefImage.src = "img/" + clef + "-clef-staff.png";
    clefImage.alt = clef;
    clefImage.classList.add("note-image");
    let noteImage = gen("img");
    noteImage.src = "img/" + noteData.filename;
    noteImage.alt = currentNote;
    noteImage.classList.add("note-image");
    let quizImage = id("quiz-image")
    quizImage.appendChild(clefImage);
    quizImage.appendChild(noteImage);
    quizImage.classList.remove("hidden");
  }

   /**
   * Identifies whether the correct key was clicked. If yes, displays congratulatory
   * text and moves on to the next question. If no, makes the key red for
   * 2 seconds.
   * @param {*} evt - The key that was clicked
   */
  function handleKeyboardClick(evt) {
    numAttempts = numAttempts + 1;
    let key = evt.currentTarget;
    if (key.id == currentNote) {
      key.classList.add("correct");
      id(currentNote).removeEventListener("click", handleKeyboardClick);
      id("quiz-attempts").textContent = numAttempts;
      showQuizCorrectView()
      startCountdown();
    } else {
      key.classList.add("wrong");
      // return key to original color after 200 ms
      setTimeout(() => {
        key.classList.remove("wrong");
      }, 200);
    }
  }

  /** Displays a countdown starting from 5 seconds. */
  function startCountdown() {
    id("word-seconds").textContent = "seconds";
    id("countdown").textContent = 5;
    let secondsRemaining = 5;
    timerId = setInterval(function() {
      secondsRemaining = secondsRemaining - 1;
      if (secondsRemaining === 1) {
        id("word-seconds").textContent = "second";
      } else if (secondsRemaining === 0) {
        loadNextQuestion();
      }
      id("countdown").textContent = secondsRemaining;
    }, 1000);
  }

  /**
   * Loads the next question in the quiz, changing the images
   * and hiding some text.
   */
  function loadNextQuestion() {
    clearInterval(timerId);
    id(currentNote).addEventListener("click", handleKeyboardClick);
    // Remove the green color
    id(currentNote).classList.remove("correct");
    id("quiz-image").classList.add("hidden");
    hideQuizCorrectView()
    numAttempts = 0;
    id("quiz-image").innerHTML = "";
    if (chosenOption == "all") {
      handleAllNotesOption();
    } else {
      dealWithOptions();
    }
  }

  /**
   * If the "all notes" option is select, a random clef and a random note
   * are selected for the quiz.
  */
  function handleAllNotesOption() {
    let rand = Math.round(Math.random());
    if (rand == 1) {
      if (currentClef != "treble") {
        changeKeyboard("treble");
        currentClef = "treble";
      }
      getRandomMusicNote("treble");
    } else {
      if (currentClef != "bass") {
        changeKeyboard("bass");
        currentClef = "bass";
      }
      getRandomMusicNote("bass");
    }
  }

  /** Hides the elements that appear when a question is answered correctly. */
  function hideQuizCorrectView() {
    qs("#correct-view img").classList.add("hidden");
    let hiddenWords = qsa("#correct-view p");
    for (let i = 0; i < hiddenWords.length; i++) {
      hiddenWords[i].classList.add("hidden");
    }
    id("next-btn").classList.add("hidden");
  }

  /** Shows the elements that appear when a question is answered correctly. */
  function showQuizCorrectView() {
    qs("#correct-view img").classList.remove("hidden");
    let hiddenWords = qsa("#correct-view p");
    for (let i = 0; i < hiddenWords.length; i++) {
      hiddenWords[i].classList.remove("hidden");
    }
    id("next-btn").classList.remove("hidden");
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