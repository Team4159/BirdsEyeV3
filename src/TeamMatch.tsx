class TeamMatch {
    public teamName: string;
    public event: string;
    public match: string;
    public autoFuels: number;
    public autoClimbStatus: string;
    public autoNotes: string;
    public teleopFuels: number;
    public endgameClimbStatus: string;
    public fouls: number;
    public techFouls: number;

    public constructor(
        teamName: string,
        event: string,
        match: string,
        autoFuels: number,
        autoClimbStatus: string,
        autoNotes: string,
        teleopFuels: number,
        endgameClimbStatus: string,
        fouls: number,
        techFouls: number){
            this.teamName = teamName;
            this.event = event;
            this.match = match,
            this.autoFuels = autoFuels,
            this.autoClimbStatus = autoClimbStatus,
            this.autoNotes = autoNotes,
            this.teleopFuels = teleopFuels,
            this.endgameClimbStatus = endgameClimbStatus,
            this.fouls = fouls,
            this.techFouls = techFouls
    }
}

// Firestore data converter
const teamMatchConverter = {
    toFirestore: (teamMatch: TeamMatch) => {
        return {
            teamName: teamMatch.teamName,
            event: teamMatch.event,
            match: teamMatch.match,
            autoFuels: teamMatch.autoFuels,
            autoClimbStatus: teamMatch.autoClimbStatus,
            autoNotes: teamMatch.autoNotes,
            teleopFuels: teamMatch.teleopFuels,
            endgameClimbStatus: teamMatch.endgameClimbStatus,
            fouls: teamMatch.fouls,
            techFouls: teamMatch.techFouls
        };
    },
    // fromFirestore: (snapshot, options) => {
    //     const data = snapshot.data(options);
    //     return new City(data.name, data.state, data.country);
    // }
};