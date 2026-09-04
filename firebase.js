 import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

  let db = null;

    const firebaseConfig = {
      apiKey: "AIzaSyAK6wJUBK83xIwwuQPIc6FdefZBTe1",
      authDomain: "://firebaseapp.com",
      databaseURL: "https://firebaseio.com",
      projectId: "celeste-research",
      storageBucket: "celeste-research.firebasestorage.app",
      messagingSenderId: "432857538059",
      appId: "1:432857538059:web:049c4b29f34ffa9012f10e"
    };

    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log("Firebase initialized successfully (Production Mode)");


  // --- PERSISTENT SESSION ID LOGIC ---
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  let sessionId = localStorage.getItem("pico8_session_id");
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem("pico8_session_id", sessionId);
  }
  
  console.log(`Session ID: ${sessionId}`);

  // Initialize and poll GPIO
  window.pico8_gpio = new Array(128).fill(0);

  setInterval(() => {
    if (window.pico8_gpio[0] === 2) { 
        window.pico8_gpio[0] = 1; 

        let msg = "";
        let i = 1;
        while (window.pico8_gpio[i] !== 0 && i < 128) {
          msg += String.fromCharCode(window.pico8_gpio[i]);
          i++;
        }

        const parts = msg.split(":");
        const type = parts[0];
        const levelNum = "level_" + parts[1];

        if (type === "death" || type === "final_deaths") {
          const value = parseInt(parts[2]);
          console.log(`[Log] ${levelNum} -> Deaths: ${value}`);

          // Send to Firebase only if live
          if (db) {
            db.ref(`game_logs/${sessionId}/levels/${levelNum}`).update({ 
              total_deaths: value 
            });
          }

        } else if (type === "time") {
          const formattedTime = `${parts[2]} ${parts[3]}`; 
          console.log(`[Log] ${levelNum} -> Time to complete: ${formattedTime}`);

          // Send to Firebase only if live
          if (db) {
            db.ref(`game_logs/${sessionId}/levels/${levelNum}`).update({ 
              time_to_complete: formattedTime 
            });
          }
        }

        window.pico8_gpio[0] = 0;
    }
  }, 30);