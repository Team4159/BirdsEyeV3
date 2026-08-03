import { doc, setDoc, type Firestore } from "firebase/firestore";

export async function persistData(
  database: Firestore,
  path: string,
  element: string,
  data: object,
) {
  try {
    await setDoc(doc(database, path, element), data);
  } catch (e) {
    console.error("Error adding document: " + e);
  }
}
