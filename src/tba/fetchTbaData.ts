type ETagEntry = {
  etag: string;
  data: unknown;
};
const etagEntries: Record<string, ETagEntry> = {};

/** @param extension extension for tba API */
export async function fetchTbaData(tbaKey: string, extension: string) {
  if (!tbaKey) {
    return null;
  }
  let response = null;
  const headers: Record<string, string> = {
    "X-TBA-Auth-Key": tbaKey,
  };
  if (etagEntries[extension]) {
    headers["If-None-Match"] = etagEntries[extension].etag;
  }
  try {
    response = await fetch(
      `https://www.thebluealliance.com/api/v3${extension}`,
      {
        headers: headers,
        cache: "no-cache",
      },
    );
    if (response.status === 304) {
      return etagEntries[extension]?.data ?? null;
    }
    if (!response.ok) {
      throw new Error("TBA API Error");
    }
    const json = await response.json();
    const etag = response.headers.get("ETag");
    if (etag) {
      etagEntries[extension] = {
        etag: etag,
        data: json,
      };
    }
    return json;
  } catch (error) {
    console.error("TBA fetch error:", error);
    alert(
      `Error fetching data from The Blue Alliance (Status ${response?.status})`,
    );
    return null;
  }
}
