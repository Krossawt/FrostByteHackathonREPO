"""
eSKala — Content Moderation
Filters profanity and inappropriate language from citizen-submitted text
(suggestions, replies) before they are saved to the database.
"""

from better_profanity import profanity

# Load the built-in English word list, then extend it with common
# Filipino/Tagalog profanity since this is a barangay-facing platform.
profanity.load_censor_words()
profanity.add_censor_words([
    # Tagalog
    "putangina", "putang ina", "putanginamo", "tangina", "tangina mo",
    "tang ina", "put ina", "ina mo", "kingina", "kinginamo",
    "gago", "gaga", "gagi", "gagong",
    "tanga", "ulol", "ulul",
    "tarantado", "tarantada", "bobo", "boba",
    "puta", "putax", "leche", "lecheng",
    "kupal", "hayop", "hayup",
    "peste", "pesteng", "yawa", "buwisit",
    "punyeta", "punyemas", "hinayupak", "walanghiya", "walang hiya",
    "pakshet", "pakyu", "pucha",
    "abnoy", "siraulo", "sira ulo", "lintik", "letse",
    "engot", "linta", "duwag",

    # English
    "fuck", "fucking", "fucker", "motherfucker",
    "shit", "bullshit", "bitch", "asshole",
    "bastard", "goddamn", "dick", "dickhead",
    "cunt", "prick", "cock", "piss",
    "slut", "whore", "idiot", "moron",
    "retard", "retarded", "douchebag", "twat", "wanker",
])


def check_text(text: str) -> tuple[bool, str]:
    """
    Returns (is_flagged, censored_text).
    is_flagged=True means the text contains profanity.
    """
    is_flagged = profanity.contains_profanity(text)
    censored_text = profanity.censor(text)
    return is_flagged, censored_text