/** @param extension extension for tba API */
export async function fetchTBAData(tbaKey: string, extension : string){
    if (!tbaKey) {
        alert('Please set your Blue Alliance API key first');
        return null;
    }
    try {
        const response = await fetch(`https://www.thebluealliance.com/api/v3${extension}`, {
            headers: {
                'X-TBA-Auth-Key': tbaKey
            }
        });
        if (!response.ok) throw new Error('TBA API Error');
        return await response.json();
    } catch (error) {
        console.error('TBA fetch error:', error);
        alert('Error fetching data from The Blue Alliance');
        return null;
    }
}