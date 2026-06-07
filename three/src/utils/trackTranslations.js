export const genreTranslations = {
  "Phonk": "Фонк",
  "Hip-Hop": "Хіп-хоп",
  "Trap": "Треп",
  "Lo-Fi": "Лоу-фай",
  "Pop": "Поп",
  "Rock": "Рок",
  "Electronic": "Електроніка",
  "House": "Хаус",
  "Techno": "Техно",
  "R&B": "R&B",
  "Rap": "Реп",
  "Jazz": "Джаз",
  "Drill": "Дріл",
  "Ambient": "Ембієнт"
};

export const moodTranslations = {
  "Dark": "Темний",
  "Sad": "Сумний",
  "Happy": "Веселий",
  "Aggressive": "Агресивний",
  "Chill": "Розслаблений",
  "Energetic": "Енергійний",
  "Melancholic": "Меланхолійний",
  "Romantic": "Романтичний",
  "Epic": "Епічний",
  "Relax": "Спокійний",
  "Calm": "Спокійний",
  "Dreamy": "Мрійливий"
};

export const keyTranslations = {
  "C Major": "C",
  "C# Major": "C#",
  "D Major": "D",
  "D# Major": "D#",
  "E Major": "E",
  "F Major": "F",
  "F# Major": "F#",
  "G Major": "G",
  "G# Major": "G#",
  "A Major": "A",
  "A# Major": "A#",
  "B Major": "B",

  "C Minor": "Cm",
  "C# Minor": "C#m",
  "D Minor": "Dm",
  "D# Minor": "D#m",
  "E Minor": "Em",
  "F Minor": "Fm",
  "F# Minor": "F#m",
  "G Minor": "Gm",
  "G# Minor": "G#m",
  "A Minor": "Am",
  "A# Minor": "A#m",
  "B Minor": "Bm",

  "Major": "Major",
  "Minor": "Minor",

  "До мажор": "C",
  "До# мажор": "C#",
  "Ре мажор": "D",
  "Ре# мажор": "D#",
  "Мі мажор": "E",
  "Фа мажор": "F",
  "Фа# мажор": "F#",
  "Соль мажор": "G",
  "Соль# мажор": "G#",
  "Ля мажор": "A",
  "Ля# мажор": "A#",
  "Сі мажор": "B",

  "До мінор": "Cm",
  "До# мінор": "C#m",
  "Ре мінор": "Dm",
  "Ре# мінор": "D#m",
  "Мі мінор": "Em",
  "Фа мінор": "Fm",
  "Фа# мінор": "F#m",
  "Соль мінор": "Gm",
  "Соль# мінор": "G#m",
  "Ля мінор": "Am",
  "Ля# мінор": "A#m",
  "Сі мінор": "Bm"
};

export function translateGenre(value) {
  return genreTranslations[value] || value || "Без жанру";
}

export function translateMood(value) {
  if (!value) return "Настрій не вказано";

  return value
    .split(", ")
    .map(mood => moodTranslations[mood] || mood)
    .join(", ");
}

export function translateKey(value) {
  return keyTranslations[value] || value || "Тональність не вказано";
}