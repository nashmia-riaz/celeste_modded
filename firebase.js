import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
getFirestore,
doc,
setDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import {
getAuth,
signInAnonymously,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
 
const firebaseConfig = {
    apiKey: "AIzaSyAK6wJUBK83xIwwuQPIc6FdefZBTe1-7kU",
    authDomain: "celeste-research.firebaseapp.com",
    databaseURL: "https://celeste-research-default-rtdb.firebaseio.com",
    projectId: "celeste-research",
    storageBucket: "celeste-research.firebasestorage.app",
    messagingSenderId: "432857538059",
    appId: "1:432857538059:web:049c4b29f34ffa9012f10e"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);

const runId = params.get("run") || crypto.randomUUID();
const referrer = params.get("ref") || null;
const user = params.get("user");

let currentUser = null;
let lastSeq = 0;
let lastSentDeaths = -1;

await signInAnonymously(auth);

onAuthStateChanged(auth, user => {
    currentUser = user;
});

async function writeToDatabase(levelId, eventType, args) {
    if (!currentUser) return;
    if(eventType === "level_finished" && levelId){
      await setDoc(
        doc(db, "celeste_runs", runId),
        {
            user,
            runId,
            referrer,
            [levelId]:args,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
    }
    else if(eventType === "deaths"){
       await setDoc(
        doc(db, "celeste_runs", runId),
        {
            user,
            runId,
            referrer,
            [levelId]:args,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
    }
    else if(eventType === "game_finished"){
      await setDoc(
        doc(db, "celeste_runs", runId),
        {
            user,
            runId,
            referrer,
            ['game_finished']:args,
            updatedAt: serverTimestamp()
        },
        { merge: true }
    );
    }
}

function logPico8Gpio(){ if (window.pico8_gpio[0] === 2) { 
        window.pico8_gpio[0] = 1; 

        let msg = "";
        let i = 1;
        while (window.pico8_gpio[i] !== 0 && i < 128) {
          msg += String.fromCharCode(window.pico8_gpio[i]);
          i++;
        }

        const parts = msg.split(":");
        const type = parts[2];
        const levelNum = "level_" + parts[1];

        if(type==="deaths"){
          const deaths = parts[3]
        console.log(parts);
          writeToDatabase(levelNum, type, {deaths});
        }
        if (type === "level_finished") {
          const formattedTime = `${parts[4]} ${parts[5]}`;
          const gotFruit = `${parts[7]}` 
          const deaths=`${parts[9]}`
            writeToDatabase(levelNum, type, {time: formattedTime, fruit: gotFruit, deaths:deaths}).catch(console.error);
        }
        else if(type==="game_finished"){
          const totalTime=`${parts[4]} ${parts[5]}`;
          const totalFruits=`${parts[7]}`;
          const totalDeaths=`${parts[9]}`;
          writeToDatabase(null, type, {totalTime, totalFruits, totalDeaths});
        }

        window.pico8_gpio[0] = 0;
    }
  }

setInterval(logPico8Gpio, 100);
async function testFirebaseWrite() {
  try {
    await setDoc(
      doc(db, "celeste_test", "hello"),
      {
        message: "Firebase write works",
        createdAt: serverTimestamp()
      },
      { merge: true }
    );

    console.log("✅ Test Firebase write succeeded");
  } catch (err) {
    console.error("❌ Test Firebase write failed:", err);
  }
}
