import { getDocs, collection, addDoc, setDoc, doc, Firestore } from "firebase/firestore";

/** @param extension extension for tba API */
export async function fetchScoutedData(firestore: Firestore){
    const querySnapshot = await getDocs(collection(firestore, "users"));
    querySnapshot.forEach((doc) => {
    console.log(`${doc.id} => ${doc.data()}`);
    });
}