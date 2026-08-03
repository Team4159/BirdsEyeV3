/** @param extension extension for tba API */
export async function fetchTbaData(
  tbaKey: string,
  extension: string,
  cache?: boolean,
) {
  if (!tbaKey) {
    return null;
  }
  if (cache === undefined) {
    cache = false;
  }
  let response = null;
  try {
    response = await fetch(
      `https://www.thebluealliance.com/api/v3${extension}`,
      {
        headers: {
          "X-TBA-Auth-Key": tbaKey,
        },
        cache: cache ? "default" : "no-cache",
      },
    );
    if (!response.ok) throw new Error("TBA API Error");
    return await response.json();
  } catch (error) {
    console.error("TBA fetch error:", error);
    alert(
      `Error fetching data from The Blue Alliance (Status ${response?.status})`,
    );
    return null;
  }
}
