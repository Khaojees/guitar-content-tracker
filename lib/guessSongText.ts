const FILLER_LENGTH = 800;

const buildFillerLine = () => ".".repeat(FILLER_LENGTH);

export const buildGuessSongText = (songName: string, artistName: string) =>
  [
    "🎸 Guess this song 👇",
    buildFillerLine(),
    `song : ${songName}`,
    `artist : ${artistName}`,
    "#1LaPlay #วันละเพลวันละเพลง #guesssong",
  ].join("\n");
