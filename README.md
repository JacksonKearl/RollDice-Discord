# RollDice

## Discord bot for personalized D&D dice rolling

There are a million and one dice rolling apps out there, but I find they tend to have the same issues:

1. Cryptic syntax: things like `!...` or `\roll...`, etc., bring you out of the game, especially when you mistype and are stuck trying to remember what this particular engine uses.
2. Lacking personalization. many existing apps, especially bots, don't allow for saved rolls. This also takes you out of the game, especially when you need to take tim e to consult your character sheet for what the roll should be.
3. Overly general: this isn't so much an issue with other apps, nothing wrong with supporting many games, but it is a non-goal of this one. I aim to keep the docs for this app as deadly simple as possible, only supporting operations I use in D&D.

This bot aims to have none of those issues, instead using:

1. "No syntax": Typing "d20" rolls a d20. Typing "dex" does a dex check. Etc. No exclamation points or backslashes needed.
2. Personal Aliases & Values: It can store roll actions or the results of those actions, and easily call, view and modify them.
3. D&D specific presets: Dice don't explode. An arcana check is a wisdom check, unless otherwise specified. Etc.

### Example Trace

```
make_skill = 4d6k3 - 10 / 2
> make_skill is 4d6k3 - 10 / 2
str_mod = !make_skill
str_mod is 3
str_check = d20 + str_mod
> str_check is d20 + 3
str_check
> 12
str_check
> 18
ath
> 9

mace.hit = d20 + 5
mace.hit
> 9
mace.hit @adv
> 25
mace.hit @dis
> 8
```

### Syntax

```
Line =
    Alias
    Command
    Command @adv
    Command @dis

Alias =
    Name `=` Command

Command =
    Roll
    Name
    Number
    !Command
    Command + Command
    Command / Command
    Command - Command
    Command * Command

Roll = (\d+?)d(\d+)(k\d+)? // ex `4d6k2`, `d20`, or `2d10`
Number = \d+ // any integer
Name = (\w|\.)+ // alphanumeric, plus period.
```

Notes:

- A `Name` cannot also be a `Roll`
- Arithmetic is always done left-to right, all operations have equal precedence
- `!Command` executes the `Command` and returns the result, so `wis = !d20` would make each call to `wis` return the same value, whereas `wis = d20` would make each call return a newly generated value. This is mainly helpful for one-time initializations, like hit points or skill modifiers.
- `Command @adv` executes the `Command` twice and returns the higher value. Similar for `@dis`, but returning the lower value.
- Outside of `Roll`, `Number`, and `Name`, whitespace is ignored.
