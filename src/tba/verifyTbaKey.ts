/** @param extension extension for tba API */
export async function verifyTbaKey(
  tbaKey: string,
): Promise<[boolean, string | null]> {
  if (!tbaKey) {
    return [false, "Please input your TBA API key first"];
  }
  let response;
  try {
    response = await fetch(`https://www.thebluealliance.com/api/v3/status`, {
      headers: {
        "X-TBA-Auth-Key": tbaKey,
      },
      cache: "no-store",
    });
    if (!response.ok) throw new Error();
    return [true, null];
  } catch {
    return [false, `Invalid TBA API key (Status ${response?.status})`];
  }
}
