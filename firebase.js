 // 1. FIXED: Corrected the CDN paths to point to the actual Firebase SDK files and added 'update'
  import { initializeApp } from "https://gstatic.com";
  import { getDatabase, ref, update } from "https://gstatic.com";

  console.log('firebase init');

  // 2. Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAK6wJUBK83xIwwuQPIc6FdefZBTe1",
    authDomain: "celeste-research.firebaseapp.com",
    databaseURL: "https://celeste-research-default-rtdb.firebaseio.com",
    projectId: "celeste-research",
    storageBucket: "celeste-research.firebasestorage.app",
    messagingSenderId: "432857538059",
    appId: "1:432857538059:web:049c4b29f34ffa9012f10e"
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

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
    console.log("New browser session initialized:", sessionId);
  } else {
    console.log("Welcome back! Existing browser session found:", sessionId);
  }
  // ------------------------------------

  window.pico8_gpio = new Array(128).fill(0);

  setInterval(() => {
    if (window.pico8_gpio[0] === 2) { // FIXED: Specified index [0] to check the status pin accurately
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

        // Create a direct reference path to this specific level under the user's session
        const levelRef = ref(db, `game_logs/${sessionId}/levels/${levelNum}`);

        if (type === "death" || type === "final_deaths") {
          const value = parseInt(parts[2]); // Using parseInt for death counts
          update(levelRef, {
              total_deaths: value
          }).then(() => {
              console.log(`Updated ${levelNum} deaths to ${value}`);
          }).catch(e => console.error("Firebase write error:", e));

        } else if (type === "time") {
          // FIXED: Adjusted to pass the formatted "Xm Ys" string if using your custom PICO-8 duration string
          // Expected data format from your PICO-8: "time:1:2m:14s"
          // parts[0]="time", parts[1]="1", parts[2]="2m", parts[3]="14s"
          const formattedTime = `${parts[2]} ${parts[3]}`; 
          
          update(levelRef, {
              time_to_complete: formattedTime
          }).then(() => {
              console.log(`Saved ${levelNum} time: ${formattedTime}`);
          }).catch(e => console.error("Firebase write error:", e));
        }

        window.pico8_gpio[0] = 0;
    }
  }, 30);