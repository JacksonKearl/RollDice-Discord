# RollDice

## Discord bot for simple, personalized, D&D dice rolling
or...
## Lazily executed language with first-class support for random variable literals

There are a million and one dice rolling apps out there, but I find they tend to have the same issues:

1. Cryptic syntax: things like `!...` or `\roll...`, etc., bring you out of the game, especially when you mistype and are stuck trying to remember what this particular engine uses.
2. Lacking personalization: many existing apps, especially bots, don't allow for saved rolls. This also takes you out of the game, especially when you need to take time to consult your character sheet for what the roll should be.
3. Overly general: this isn't so much an issue with other apps, nothing wrong with supporting many games, but it is a non-goal of this one. I aim to keep the interface for this app as deadly simple as possible, only supporting operations I use in D&D.

This bot aims to have none of the above issues, instead opting for:

1. "No syntax": Typing "d20" rolls a d20. Typing "dex" does a dex check. Etc. No exclamation points or backslashes needed.
2. Personal Aliases & Values: the bot can store roll actions or the results of those actions, and easily call, view and modify them.
3. Default D&D specific interface: Dice don't explode. An arcana check is a wisdom check, unless otherwise specified. Etc.

### Example Trace

```
make_skill = 4d6k3 - 10 / 2
> make_skill is 4d6k3 - 10 / 2
str_mod = !make_skill
> str_mod is 3
str = d20 + str_mod
> str is d20 + 3
str
> 12
str
> 18
ath // defaults to strength.check
> 9

gold = 0
> gold is 0
gold += 5
> gold is 5
gold
> 5
```

### Syntax

```
Line =
    Alias
    Command

Alias =
    Name = Command

Increment =
    Name += Command

Decrement =
    Name += Command

Command =
    Roll
    Name
    Number
    ! Command
    ( Command )
    Command @ Modifier
    Command + Command
    Command / Command
    Command - Command
    Command * Command

Modifier =
    advantage
    disadvantage

Roll = (\d+?)d(\d+)(k\d+)? // ex `4d6k2`, `d20`, or `2d10`
Number = \d+ // any integer
Name = (\w|\.)+ // alphanumeric, plus period.
```

Notes:

- A `Name` cannot also be a `Roll`
- Precendence follows normal arithmatic rules, with `At` being lowest precendence besides `=`, and `Bang` and `Negate` being hoghest precendence. 
- `!Command` executes the `Command` and returns the result, so `wis = !d20` would make each call to `wis` return the same value, whereas `wis = d20` would make each call return a newly generated value. This is mainly helpful for one-time initializations, like hit points or skill modifiers.
- `Command @adv` executes the `Command` twice and returns the higher value. Similar for `@dis`, but returning the lower value.
- Outside of `Roll`, `Number`, and `Name`, whitespace is ignored.

### Web Interface

A web interface will be served to help with managing the bot. It provides a way to look into and modify the running environment, or provide a default global initialization. For example, a D&D campaign might initialize their environment to:

```json
{
  "globals": {
    "make_skill": "4d6k3 - 10 / 2",
    "str.mod": "<<initialize with `str.mod = !make_skill`>>",
    "dex.mod": "<<initialize with `dex.mod = !make_skill`>>",
    "con.mod": "<<initialize with `con.mod = !make_skill`>>",
    "int.mod": "<<initialize with `int.mod = !make_skill`>>",
    "wis.mod": "<<initialize with `wis.mod = !make_skill`>>",
    "cha.mod": "<<initialize with `cha.mod = !make_skill`>>",
    "str": "d20 + str.mod",
    "dex": "d20 + dex.mod",
    "con": "d20 + con.mod",
    "int": "d20 + int.mod",
    "wis": "d20 + wis.mod",
    "cha": "d20 + cha.mod",
    "acrobatics": "dex",
    "animals": "wis",
    "athletics": "str",
    "deception": "cha",
    "history": "int",
    "insight": "wis",
    "intimidation": "cha",
    "investigation": "int",
    "medicine": "wis",
    "nature": "int",
    "perception": "wis",
    "performance": "cha",
    "persuasion": "cha",
    "religion": "int",
    "slight": "dex",
    "stealth": "dex",
    "survival": "wis"
  }
}
```

Over time, as adventurers gain proficiencies and set their skill modifiers, the environment might begin to look something like this:

```json
{
    "globals": { ... },
    "Agates The Great": {
        "str.mod": "2",
        "dex.mod": "1",
        "con.mod": "0",
        "int.mod": "2",
        "wis.mod": "-1",
        "cha.mod": "3",
        "intimidation": "cha + 2",
        "religion": "int + 2",
        "dagger.attack": "d20 + str.mod",
        "dagger.damage": "1d4 + str.mod",
        "gold": 50,
        "hp": 23
    }
}
```

Here, the discord user with name `Agetes The Great` has set up his character's skill modifiers, declared a proficiency in `intimidation` and `religion`, added his weapon's properties, and is tracking his hit points and gold.

> Note: this set up all done in Discord, the web interface simply allows an admin to keep tabs on the state of the app, and make any tweaks as needed.
