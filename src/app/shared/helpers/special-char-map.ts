export const SPECIAL_CHAR_MAP: { [key: string]: string } = {
    // Deutsch (Umlaute, ß)
    "\u00e4": "ae", // ä
    "\u00c4": "Ae", // Ä
    "\u00f6": "oe", // ö
    "\u00d6": "Oe", // Ö
    "\u00fc": "ue", // ü
    "\u00dc": "Ue", // Ü
    "\u00df": "ss", // ß

    // Französisch/Italienisch/Spanisch/Skandinavisch etc.
    "\u00e0": "a", // à
    "\u00e1": "a", // á
    "\u00e2": "a", // â
    "\u00e3": "a", // ã
    "\u00e5": "a", // å
    "\u00e6": "ae", // æ (Dänisch/Norwegisch)
    "\u0105": "a", // ą (Polnisch)

    "\u00e7": "c", // ç
    "\u0107": "c", // ć
    "\u010d": "c", // č

    "\u00e8": "e", // è
    "\u00e9": "e", // é
    "\u00ea": "e", // ê
    "\u00eb": "e", // ë
    "\u0119": "e", // ę (Polnisch)
    "\u011b": "e", // ě (Tschechisch)

    "\u00ec": "i", // ì
    "\u00ed": "i", // í
    "\u00ee": "i", // î
    "\u00ef": "i", // ï
    "\u0131": "i", // ı (Türkisch)

    "\u0142": "l", // ł (Polnisch)

    "\u00f1": "n", // ñ
    "\u0144": "n", // ń

    "\u00f2": "o", // ò
    "\u00f3": "o", // ó
    "\u00f4": "o", // ô
    "\u00f5": "o", // õ
    "\u00f8": "o", // ø (Dänisch/Norwegisch)
    "\u0153": "oe", // œ (Französisch)

    "\u015b": "s", // ś
    "\u0161": "s", // š

    "\u00fa": "u", // ú
    "\u00fb": "u", // û
    "\u00f9": "u", // ù
    "\u016f": "u", // ů (Tschechisch)
    "\u0171": "u", // ű (Ungarisch)

    "\u00fd": "y", // ý
    "\u00ff": "y", // ÿ

    "\u017a": "z", // ź
    "\u017c": "z", // ż
    "\u017e": "z", // ž

    // Großbuchstaben (entweder alles groß oder gemappt auf camelCase)
    "\u00c0": "A", // À
    "\u00c1": "A", // Á
    "\u00c2": "A", // Â
    "\u00c3": "A", // Ã
    "\u00c5": "A", // Å
    "\u00c6": "Ae", // Æ
    "\u0104": "A", // Ą

    "\u00c7": "C", // Ç
    "\u0106": "C", // Ć
    "\u010c": "C", // Č

    "\u00c8": "E", // È
    "\u00c9": "E", // É
    "\u00ca": "E", // Ê
    "\u00cb": "E", // Ë
    "\u0118": "E", // Ę
    "\u011a": "E", // Ě

    "\u00cc": "I", // Ì
    "\u00cd": "I", // Í
    "\u00ce": "I", // Î
    "\u00cf": "I", // Ï
    "\u0130": "I", // İ (Türkisch)

    "\u0141": "L", // Ł

    "\u00d1": "N", // Ñ
    "\u0143": "N", // Ń

    "\u00d2": "O", // Ò
    "\u00d3": "O", // Ó
    "\u00d4": "O", // Ô
    "\u00d5": "O", // Õ
    "\u00d8": "O", // Ø
    "\u0152": "Oe", // Œ

    "\u015a": "S", // Ś
    "\u0160": "S", // Š

    "\u00da": "U", // Ú
    "\u00db": "U", // Û
    "\u00d9": "U", // Ù
    "\u016e": "U", // Ů
    "\u0170": "U", // Ű

    "\u00dd": "Y", // Ý

    "\u0179": "Z", // Ź
    "\u017b": "Z", // Ż
    "\u017d": "Z", // Ž
};
