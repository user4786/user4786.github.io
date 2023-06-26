/**
 * Header comment
 * Audio from https://github.com/fuhton/piano-mp3/blob/master/piano-mp3/Gb7.mp3
 */

"use strict";
(function () {
  window.addEventListener("load", init);
  let option1 = ["e3", "f3", "gb3", "g3", "ab3", "a3", "bb3", "b3", "c4"];
  let option2 = ["c4", "db4", "d4", "eb4", "e4", "f4", "gb4", "g4", "ab4", "a4", "bb4", "b4", "c5"];
  let option3 = ["c5", "db5", "d5", "eb5", "e5", "f5", "gb5", "g5", "ab5", "a5", "bb5", "b5", "c6"];
  let option4 = ["c6", "db6", "d6", "eb6", "e6", "f6"];
  let option5 = ["g1", "ab1", "a1", "bb1", "b1", "c2",];
  let option6 = ["c2", "db2", "d2", "eb2", "e2", "f2", "gb2", "g2", "ab2", "a2", "bb2", "b2", "c3"];
  let option7 = ["c3", "db3", "d3", "eb3", "e3", "f3", "gb3", "g3", "ab3", "a3", "bb3", "b3", "c4"];
  let option8 = ["c4", "db4", "d4", "eb4", "e4", "f4", "gb4", "g4", "ab4", "a4"];
  let chosenOption = "option2";
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
    dealWithOptions(false);
    let keysCheckbox = qs(".keys-checkbox input");
    keysCheckbox.addEventListener("click", showHideKeys);
    let allPianoKeys = qsa(".key");
    for (let i = 0; i < allPianoKeys.length; i++) {
      allPianoKeys[i].addEventListener("click", playNoteOnPiano);
      allPianoKeys[i].addEventListener("click", handleKeyboardClick);
      if (allPianoKeys[i].classList.contains("white")) {
        allPianoKeys[i].classList.add("gray-out");
      }
    }
    for (let i = 0; i < option2.length; i++) {
      id(option2[i]).classList.remove("gray-out");
    }
    let choiceButtons = qsa("#settings button");
    for (let i = 0; i < choiceButtons.length; i++) {
      choiceButtons[i].addEventListener("click", changeOption);
    }
    id("play-sound-btn").addEventListener("click", playSound);
    id("next-btn").addEventListener("click", loadNextQuestion);
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

  function playSound() {
    playNote(currentNote);
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
    id(currentNote).classList.remove("correct");
    let previousChoice = qs(".current-choice");
    previousChoice.classList.remove("current-choice");
    evt.currentTarget.classList.add("current-choice");
    chosenOption = evt.currentTarget.id;
    if (evt.currentTarget.classList.contains("treble-option")) {
      currentClef = "treble";
    } else {
      currentClef = "bass";
    }
    let whiteKeys = qsa(".white:not(.gray-out)");
    for (let i = 0; i < whiteKeys.length; i++) {
      whiteKeys[i].classList.add("gray-out");
    }
    dealWithOptions(true);
  }

  /**
   * Identifies which note range option was chosen and chooses a note
   * from that range.
   * @param {boolean} change - True if the range option was changed
   */
  function dealWithOptions(change) {
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
    if (change) {
      for (let i = 0; i < option.length; i++) {
        id(option[i]).classList.remove("gray-out");
      }
    }
    currentNote = option[Math.floor(Math.random() * option.length)]
    if (!id("show-flats").checked && currentNote.length == 3) {
      currentNote = currentNote.substring(0, 1) + currentNote.substring(2);
    }
    changeKeyboard(currentClef);
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
    timerId = setInterval(function () {
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
    hideQuizCorrectView()
    numAttempts = 0;
    dealWithOptions(false);
    id("play-sound-btn").click();
  }

  /** Hides the elements that appear when a question is answered correctly. */
  function hideQuizCorrectView() {
    qs("#correct-view img").classList.add("invisible");
    let hiddenWords = qsa("#correct-view p");
    for (let i = 0; i < hiddenWords.length; i++) {
      hiddenWords[i].classList.add("invisible");
    }
    id("next-btn").classList.add("invisible");
  }

  /** Shows the elements that appear when a question is answered correctly. */
  function showQuizCorrectView() {
    qs("#correct-view img").classList.remove("invisible");
    let hiddenWords = qsa("#correct-view p");
    for (let i = 0; i < hiddenWords.length; i++) {
      hiddenWords[i].classList.remove("invisible");
    }
    id("next-btn").classList.remove("invisible");
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